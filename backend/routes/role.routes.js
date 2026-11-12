/**
 * Role-Based Access Control (RBAC) API Routes
 * Enforces designated operations per role:
 *  - Front-Desk: Member Registration CRM
 *  - Clinical Assessor: PAR-Q Screening & Medical Assessments
 *  - Turnstile Gate: Real-Time RFID Access Verification
 *  - Data Steward: Multi-Source ETL Pipeline & DQM Auditing
 *  - Club Manager: Executive BI Analytics & Member 360 Warehouse
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../db/neon');
const { executeLiveDatabaseEtl, seedMultiSourceIfEmpty } = require('../db/multiSourceService');

// ═════════════════════════════════════════════════════════════════════
// 1. FRONT-DESK RECEPTIONIST ROLE
// ═════════════════════════════════════════════════════════════════════

// GET /api/roles/frontdesk/members
router.get('/frontdesk/members', async (req, res) => {
  try {
    await seedMultiSourceIfEmpty();
    const result = await query(
      'SELECT member_id, full_name, dob, email, membership_tier, created_at FROM crm_members ORDER BY member_id DESC LIMIT 100'
    );
    return res.json({ success: true, count: result.rows.length, members: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/roles/frontdesk/members
router.post('/frontdesk/members', async (req, res) => {
  try {
    const { full_name, dob, email, membership_tier } = req.body;
    if (!full_name) {
      return res.status(400).json({ success: false, error: 'Member full name is required.' });
    }

    const countRes = await query('SELECT COUNT(*) AS count FROM crm_members');
    const nextNum = Number(countRes.rows[0].count) + 1001;
    const member_id = `MBR-${nextNum}`;

    await query(
      `INSERT INTO crm_members (member_id, full_name, dob, email, membership_tier)
       VALUES ($1, $2, $3, $4, $5)`,
      [member_id, full_name.trim(), dob || '', email || '', membership_tier || 'Standard']
    );

    // Auto-update integrated data warehouse
    await executeLiveDatabaseEtl();

    return res.status(201).json({
      success: true,
      message: `Member ${member_id} successfully enrolled!`,
      member: { member_id, full_name, dob, email, membership_tier }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/roles/frontdesk/clearance/:memberId
router.get('/frontdesk/clearance/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const result = await query(
      `SELECT member_id, full_name, membership_tier, safety_clearance_status, risk_tier
       FROM integrated_members_360 WHERE member_id = $1`,
      [memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Member record not found.' });
    }

    // Front-desk only sees clearance outcome, NOT detailed medical notes
    return res.json({ success: true, member: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════
// 2. CLINICAL ASSESSOR / TRAINER ROLE
// ═════════════════════════════════════════════════════════════════════

// GET /api/roles/clinic/screenings
router.get('/clinic/screenings', async (req, res) => {
  try {
    await seedMultiSourceIfEmpty();
    const result = await query(
      `SELECT cs.id, cs.member_id, cm.full_name, cs.parq_status, cs.resting_heart_rate,
              cs.assessment_date, cs.medical_flag, cs.notes, cs.created_at
       FROM clinic_screenings cs
       LEFT JOIN crm_members cm ON cs.member_id = cm.member_id
       ORDER BY cs.created_at DESC LIMIT 100`
    );
    return res.json({ success: true, screenings: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/roles/clinic/screenings
router.post('/clinic/screenings', async (req, res) => {
  try {
    const { member_id, parq_status, resting_heart_rate, assessment_date, medical_flag, notes } = req.body;
    if (!member_id || !parq_status) {
      return res.status(400).json({ success: false, error: 'Member ID and PAR-Q Status are required.' });
    }

    // Check if screening already exists
    const existing = await query('SELECT id FROM clinic_screenings WHERE member_id = $1', [member_id]);
    if (existing.rows.length > 0) {
      await query(
        `UPDATE clinic_screenings
         SET parq_status = $1, resting_heart_rate = $2, assessment_date = $3, medical_flag = $4, notes = $5
         WHERE member_id = $6`,
        [parq_status, resting_heart_rate || null, assessment_date || new Date().toISOString().split('T')[0], medical_flag || 'NO', notes || '', member_id]
      );
    } else {
      await query(
        `INSERT INTO clinic_screenings (id, member_id, parq_status, resting_heart_rate, assessment_date, medical_flag, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [crypto.randomUUID(), member_id, parq_status, resting_heart_rate || null, assessment_date || new Date().toISOString().split('T')[0], medical_flag || 'NO', notes || '']
      );
    }

    // Re-run ETL to update turnstile gate rules
    await executeLiveDatabaseEtl();

    return res.json({
      success: true,
      message: `Clinical assessment for ${member_id} saved and integrated.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════
// 3. IOT TURNSTILE SCANNER ROLE
// ═════════════════════════════════════════════════════════════════════

// POST /api/roles/turnstile/scan
router.post('/turnstile/scan', async (req, res) => {
  try {
    const { member_id, facility_zone = 'Main Gym Floor' } = req.body;
    if (!member_id) {
      return res.status(400).json({ success: false, error: 'Member ID badge is required.' });
    }

    const memberRes = await query(
      `SELECT member_id, full_name, parq_status, safety_clearance_status, risk_tier
       FROM integrated_members_360 WHERE member_id = $1`,
      [member_id.trim()]
    );

    let accessGranted = false;
    let denialReason = '';
    let memberData = null;

    if (memberRes.rows.length === 0) {
      denialReason = 'Unregistered Keycard / No Member Profile in Data Warehouse.';
    } else {
      memberData = memberRes.rows[0];
      if (memberData.safety_clearance_status === 'ACTIVE_CLEARANCE') {
        accessGranted = true;
      } else if (memberData.safety_clearance_status === 'BLOCKED_MEDICAL_FLAG') {
        denialReason = 'ACCESS DENIED: Critical cardiovascular/medical flag on PAR-Q screening. Please visit clinic for doctor clearance.';
      } else {
        denialReason = 'ACCESS RESTRICTED: Incomplete PAR-Q screening. General workout floor access blocked until evaluation is completed.';
      }
    }

    // Log the turnstile scan event
    const scanId = `CHK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    await query(
      `INSERT INTO turnstile_scans (id, checkin_id, member_id, scan_time, facility_zone, access_granted, denial_reason)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6)`,
      [crypto.randomUUID(), scanId, member_id, facility_zone, accessGranted, denialReason]
    );

    return res.json({
      success: true,
      scanId,
      accessGranted,
      denialReason,
      facility_zone,
      timestamp: new Date().toISOString(),
      member: memberData
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/roles/turnstile/recent-scans
router.get('/turnstile/recent-scans', async (req, res) => {
  try {
    const result = await query(
      `SELECT ts.id, ts.checkin_id, ts.member_id, im.full_name, ts.scan_time,
              ts.facility_zone, ts.access_granted, ts.denial_reason
       FROM turnstile_scans ts
       LEFT JOIN integrated_members_360 im ON ts.member_id = im.member_id
       ORDER BY ts.scan_time DESC LIMIT 20`
    );
    return res.json({ success: true, scans: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════
// 4. DATA QUALITY STEWARD ROLE (ETL PIPELINE)
// ═════════════════════════════════════════════════════════════════════

// POST /api/roles/steward/reseed
router.post('/steward/reseed', async (req, res) => {
  try {
    await seedMultiSourceIfEmpty(true);
    const etlResult = await executeLiveDatabaseEtl();
    return res.json({
      success: true,
      message: 'Database reseeded successfully with authentic Filipino fitness screening data.',
      etlResult
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/roles/steward/run-etl
router.post('/steward/run-etl', async (req, res) => {
  try {
    await seedMultiSourceIfEmpty();
    const etlResult = await executeLiveDatabaseEtl();
    return res.json({
      success: true,
      message: 'Multi-source ETL Pipeline executed successfully.',
      etlResult
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/roles/steward/sources
router.get('/steward/sources', async (req, res) => {
  try {
    await seedMultiSourceIfEmpty();
    const crmCount = await query('SELECT COUNT(*) AS count FROM crm_members');
    const clinicCount = await query('SELECT COUNT(*) AS count FROM clinic_screenings');
    const scanCount = await query('SELECT COUNT(*) AS count FROM turnstile_scans');
    const dwCount = await query('SELECT COUNT(*) AS count FROM integrated_members_360');

    return res.json({
      success: true,
      sources: {
        crm_members: Number(crmCount.rows[0].count),
        clinic_screenings: Number(clinicCount.rows[0].count),
        turnstile_scans: Number(scanCount.rows[0].count),
        target_warehouse_360: Number(dwCount.rows[0].count)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════
// 5. CLUB GENERAL MANAGER ROLE (EXECUTIVE BI)
// ═════════════════════════════════════════════════════════════════════

// GET /api/roles/manager/overview
router.get('/manager/overview', async (req, res) => {
  try {
    await seedMultiSourceIfEmpty();

    const dwRes = await query('SELECT * FROM integrated_members_360 ORDER BY member_id ASC');
    const totalMembers = dwRes.rows.length;

    const clearedCount = dwRes.rows.filter(r => r.safety_clearance_status === 'ACTIVE_CLEARANCE').length;
    const restrictedCount = dwRes.rows.filter(r => r.safety_clearance_status === 'RESTRICTED_PENDING_PARQ').length;
    const blockedCount = dwRes.rows.filter(r => r.safety_clearance_status === 'BLOCKED_MEDICAL_FLAG').length;

    const highRiskCount = dwRes.rows.filter(r => r.risk_tier === 'HIGH').length;
    const medRiskCount = dwRes.rows.filter(r => r.risk_tier === 'MEDIUM').length;
    const lowRiskCount = dwRes.rows.filter(r => r.risk_tier === 'LOW').length;

    const tierBreakdown = {};
    dwRes.rows.forEach(r => {
      tierBreakdown[r.membership_tier] = (tierBreakdown[r.membership_tier] || 0) + 1;
    });

    const recentScans = await query(
      `SELECT ts.*, im.full_name
       FROM turnstile_scans ts
       LEFT JOIN integrated_members_360 im ON ts.member_id = im.member_id
       ORDER BY ts.scan_time DESC LIMIT 10`
    );

    const zoneRes = await query(
      `SELECT facility_zone, COUNT(*) as count FROM turnstile_scans GROUP BY facility_zone ORDER BY count DESC`
    );
    const zoneBreakdown = zoneRes.rows.map(r => ({
      zone: r.facility_zone,
      scans: Number(r.count)
    }));

    return res.json({
      success: true,
      kpis: {
        totalMembers,
        clearedCount,
        clearedPercent: totalMembers > 0 ? ((clearedCount / totalMembers) * 100).toFixed(1) : 0,
        restrictedCount,
        blockedCount,
        highRiskCount,
        medRiskCount,
        lowRiskCount,
        tierBreakdown,
        zoneBreakdown
      },
      recentScans: recentScans.rows,
      warehouse: dwRes.rows,
      members: dwRes.rows
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

