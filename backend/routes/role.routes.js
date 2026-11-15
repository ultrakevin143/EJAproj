/**
 * Role-Based Access Control (RBAC) API Routes
 * Enforces designated operations per role:
 *  - Front-Desk: Member Registration CRM
 *  - Clinical Assessor: PAR-Q Screening & Medical Assessments
 *  - Turnstile Gate: Real-Time RFID Access Verification
 *  - Data Steward: Multi-Source ETL Pipeline & DQM Auditing
 *  - Club Manager: Limited operations summary and member clearance
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, withTransaction } = require('../db/neon');
const { executeLiveDatabaseEtl, seedMultiSourceIfEmpty } = require('../db/multiSourceService');
const { requireAuth, requireRole } = require('../middleware/auth');
const { parseDateDetails, todayIsoDate, isValidEmail, validateName } = require('../lib/auditEngine');
const { SCREENING_RESULT_ABBR_MAP, VALID_SCREENING_RESULTS } = require('../lib/dqmClassifier');
const { appendAuditEvent } = require('../lib/auditLog');

async function refreshWarehouseAfterMutation(req) {
  try {
    await executeLiveDatabaseEtl(req.authUser);
    return true;
  } catch (error) {
    return false;
  }
}

// ═════════════════════════════════════════════════════════════════════
// 1. FRONT-DESK RECEPTIONIST ROLE
// ═════════════════════════════════════════════════════════════════════

// GET /api/roles/frontdesk/members
router.get('/frontdesk/members', requireAuth, requireRole('FRONTDESK', 'ADMIN'), async (req, res) => {
  try {
    const result = await query(
      'SELECT member_id, full_name, dob, email, membership_tier, created_at FROM crm_members ORDER BY member_id DESC LIMIT 100'
    );
    await appendAuditEvent(req.authUser, 'read', 'crm_members', '', 'Member intake list accessed.');
    return res.json({ success: true, count: result.rows.length, members: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

// POST /api/roles/frontdesk/members
router.post('/frontdesk/members', requireAuth, requireRole('FRONTDESK', 'ADMIN'), async (req, res) => {
  try {
    const { full_name, dob, email, membership_tier } = req.body;
    if (typeof full_name !== 'string' || full_name.trim().length > 120 || validateName(full_name).isIncomplete) {
      return res.status(400).json({ success: false, error: 'Enter a first and last name using 120 characters or fewer.' });
    }

    const parsedDob = typeof dob === 'string' ? parseDateDetails(dob) : null;
    if (!parsedDob?.isValid || parsedDob.formattedIso > todayIsoDate()) {
      return res.status(400).json({ success: false, error: 'Enter a valid date of birth that is not in the future.' });
    }
    if (typeof email !== 'string' || email.trim().length > 254 || !isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
    }
    if (membership_tier !== undefined && (typeof membership_tier !== 'string' || membership_tier.trim().length > 40)) {
      return res.status(400).json({ success: false, error: 'Membership tier must be 40 characters or fewer.' });
    }

    const normalizedName = full_name.trim().replace(/\s+/g, ' ');
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedTier = typeof membership_tier === 'string' ? membership_tier.trim() : 'Standard';
    const existingMember = await query(
      `SELECT member_id FROM crm_members
       WHERE (LOWER(TRIM(full_name)) = LOWER($1) AND dob = $2)
          OR (LOWER(TRIM(email)) = LOWER($3) AND dob = $2)
       LIMIT 1`,
      [normalizedName, parsedDob.formattedIso, normalizedEmail]
    );
    if (existingMember.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'A member with the same name or email and date of birth is already registered.' });
    }

    const member_id = `MBR-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

    await withTransaction(async (tx) => {
      await tx(
        `INSERT INTO crm_members (member_id, full_name, dob, email, membership_tier)
         VALUES ($1, $2, $3, $4, $5)`,
        [member_id, normalizedName, parsedDob.formattedIso, normalizedEmail, normalizedTier || 'Standard']
      );
      await appendAuditEvent(req.authUser, 'create', 'crm_member', member_id, 'Member intake record created.', tx);
    });

    // Auto-update integrated data warehouse
    const warehouseRefreshed = await refreshWarehouseAfterMutation(req);

    return res.status(201).json({
      success: true,
      message: warehouseRefreshed
        ? `Member ${member_id} successfully enrolled and integrated.`
        : `Member ${member_id} was enrolled, but the warehouse refresh failed. Ask a data steward to run ETL.`,
      member: { member_id, full_name: normalizedName, dob: parsedDob.formattedIso, email: normalizedEmail, membership_tier: normalizedTier || 'Standard' }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

// GET /api/roles/frontdesk/clearance/:memberId
router.get('/frontdesk/clearance/:memberId', requireAuth, requireRole('FRONTDESK', 'MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { memberId } = req.params;
    const result = await query(
      `SELECT member_id, full_name, membership_tier, safety_clearance_status
       FROM integrated_members_360 WHERE member_id = $1`,
      [memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Member record not found.' });
    }

    // Front-desk only sees clearance outcome, NOT detailed medical notes
    await appendAuditEvent(req.authUser, 'read', 'member_clearance', memberId, 'Member clearance status viewed.');
    const member = result.rows[0];
    member.safety_clearance_status = member.safety_clearance_status === 'ACTIVE_CLEARANCE'
      ? 'ACTIVE_CLEARANCE'
      : 'RESTRICTED';
    return res.json({ success: true, member });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

// ═════════════════════════════════════════════════════════════════════
// 2. CLINICAL ASSESSOR / TRAINER ROLE
// ═════════════════════════════════════════════════════════════════════

// GET /api/roles/clinic/screenings
router.get('/clinic/screenings', requireAuth, requireRole('CLINIC', 'ADMIN'), async (req, res) => {
  try {
    const result = await query(
      `SELECT cs.id, cs.member_id, cm.full_name, cs.parq_status, cs.resting_heart_rate,
              cs.assessment_date, cs.medical_flag, cs.notes, cs.created_at
       FROM clinic_screenings cs
       LEFT JOIN crm_members cm ON cs.member_id = cm.member_id
       ORDER BY cs.created_at DESC LIMIT 100`
    );
    await appendAuditEvent(req.authUser, 'read', 'clinic_screenings', '', 'Clinical screening list accessed.');
    return res.json({ success: true, screenings: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

// POST /api/roles/clinic/screenings
router.post('/clinic/screenings', requireAuth, requireRole('CLINIC', 'ADMIN'), async (req, res) => {
  try {
    const { member_id, parq_status, resting_heart_rate, assessment_date, medical_flag, notes } = req.body;
    if (typeof member_id !== 'string' || !member_id.trim() || typeof parq_status !== 'string') {
      return res.status(400).json({ success: false, error: 'Member ID and PAR-Q Status are required.' });
    }

    const normalizedMemberId = member_id.trim();
    if (normalizedMemberId.length > 50) {
      return res.status(400).json({ success: false, error: 'Member ID must be 50 characters or fewer.' });
    }
    const lowerParq = parq_status.trim().toLowerCase();
    const expandedParq = SCREENING_RESULT_ABBR_MAP[lowerParq] || lowerParq;
    const normalizedParq = VALID_SCREENING_RESULTS.includes(expandedParq.toLowerCase())
      ? expandedParq.charAt(0).toUpperCase() + expandedParq.slice(1).toLowerCase()
      : null;
    if (!normalizedParq) {
      return res.status(400).json({ success: false, error: 'PAR-Q status must be Cleared, Flagged, or Pending.' });
    }

    const hr = resting_heart_rate === null || resting_heart_rate === undefined || resting_heart_rate === ''
      ? null
      : Number(resting_heart_rate);
    if (hr !== null && (!Number.isInteger(hr) || hr < 1 || hr > 250)) {
      return res.status(400).json({ success: false, error: 'Resting heart rate must be a whole number between 1 and 250.' });
    }

    const assessmentDateInput = typeof assessment_date === 'string' && assessment_date.trim()
      ? assessment_date.trim()
      : todayIsoDate();
    const parsedAssessmentDate = parseDateDetails(assessmentDateInput);
    if (!parsedAssessmentDate.isValid || parsedAssessmentDate.formattedIso > todayIsoDate()) {
      return res.status(400).json({ success: false, error: 'Enter a valid assessment date that is not in the future.' });
    }
    if (typeof notes !== 'undefined' && typeof notes !== 'string') {
      return res.status(400).json({ success: false, error: 'Assessment notes must be text.' });
    }
    if (typeof notes === 'string' && notes.length > 500) {
      return res.status(400).json({ success: false, error: 'Assessment notes must be 500 characters or fewer.' });
    }

    const medicalFlagInput = medical_flag === undefined || medical_flag === null || medical_flag === ''
      ? 'no'
      : String(medical_flag).trim().toLowerCase();
    const affirmativeMedicalFlags = ['true', 'yes', '1', 'flagged'];
    const negativeMedicalFlags = ['false', 'no', '0', 'clear', 'unflagged'];
    if (!affirmativeMedicalFlags.includes(medicalFlagInput) && !negativeMedicalFlags.includes(medicalFlagInput)) {
      return res.status(400).json({ success: false, error: 'Medical flag must be yes or no.' });
    }
    const medicalFlagValue = affirmativeMedicalFlags.includes(medicalFlagInput) ? 'YES' : 'NO';
    const memberExists = await query('SELECT member_id FROM crm_members WHERE member_id = $1', [normalizedMemberId]);
    if (memberExists.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Member was not found in the registration system.' });
    }

    await withTransaction(async (tx) => {
      const existing = await tx('SELECT id FROM clinic_screenings WHERE member_id = $1', [normalizedMemberId]);
      if (existing.rows.length > 0) {
        await tx(
          `UPDATE clinic_screenings
           SET parq_status = $1, resting_heart_rate = $2, assessment_date = $3, medical_flag = $4, notes = $5
           WHERE member_id = $6`,
          [normalizedParq, hr, parsedAssessmentDate.formattedIso, medicalFlagValue, (notes || '').trim(), normalizedMemberId]
        );
      } else {
        await tx(
          `INSERT INTO clinic_screenings (id, member_id, parq_status, resting_heart_rate, assessment_date, medical_flag, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [crypto.randomUUID(), normalizedMemberId, normalizedParq, hr, parsedAssessmentDate.formattedIso, medicalFlagValue, (notes || '').trim()]
        );
      }
      await appendAuditEvent(req.authUser, 'update', 'clinic_screening', normalizedMemberId, 'Clinical screening record updated.', tx);
    });

    // Re-run ETL to update turnstile gate rules
    const warehouseRefreshed = await refreshWarehouseAfterMutation(req);

    return res.json({
      success: true,
      message: warehouseRefreshed
        ? `Clinical assessment for ${normalizedMemberId} saved and integrated.`
        : `Clinical assessment for ${normalizedMemberId} was saved, but the warehouse refresh failed. Ask a data steward to run ETL.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

// ═════════════════════════════════════════════════════════════════════
// 3. IOT TURNSTILE SCANNER ROLE
// ═════════════════════════════════════════════════════════════════════

// POST /api/roles/turnstile/scan
router.post('/turnstile/scan', requireAuth, requireRole('TURNSTILE', 'ADMIN'), async (req, res) => {
  try {
    const { member_id, facility_zone = 'Main Gym Floor' } = req.body;
    if (typeof member_id !== 'string' || !member_id.trim()) {
      return res.status(400).json({ success: false, error: 'Member ID badge is required.' });
    }
    const normalizedMemberId = member_id.trim();
    if (normalizedMemberId.length > 50) {
      return res.status(400).json({ success: false, error: 'Member ID must be 50 characters or fewer.' });
    }
    const zone = typeof facility_zone === 'string' ? facility_zone.trim() : '';
    if (!zone || zone.length > 60) {
      return res.status(400).json({ success: false, error: 'Facility zone must be between 1 and 60 characters.' });
    }

    const memberRes = await query(
      `SELECT member_id, safety_clearance_status
       FROM integrated_members_360 WHERE member_id = $1`,
      [normalizedMemberId]
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
        denialReason = 'Access denied. Please refer the member to clinic staff.';
      } else {
        denialReason = 'Access restricted. Please refer the member to clinic staff.';
      }
    }

    // Log the turnstile scan event
    const scanId = `CHK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    await withTransaction(async (tx) => {
      await tx(
        `INSERT INTO turnstile_scans (id, checkin_id, member_id, scan_time, facility_zone, access_granted, denial_reason)
         VALUES ($1, $2, $3, NOW(), $4, $5, $6)`,
        [crypto.randomUUID(), scanId, normalizedMemberId, zone, accessGranted, denialReason]
      );
      await appendAuditEvent(req.authUser, 'scan', 'turnstile', scanId, accessGranted ? 'Access granted.' : 'Access denied.', tx);
    });

    return res.json({
      success: true,
      scanId,
      accessGranted,
      denialReason,
      facility_zone: zone,
      timestamp: new Date().toISOString(),
      member: memberData ? { member_id: memberData.member_id } : null
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

// GET /api/roles/turnstile/recent-scans
router.get('/turnstile/recent-scans', requireAuth, requireRole('TURNSTILE', 'MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const result = await query(
      `SELECT ts.id, ts.checkin_id, ts.member_id, ts.scan_time,
              ts.facility_zone, ts.access_granted,
              CASE WHEN ts.access_granted THEN '' ELSE 'Access denied. Please refer to staff.' END AS denial_reason
       FROM turnstile_scans ts
       ORDER BY ts.scan_time DESC LIMIT 20`
    );
    await appendAuditEvent(req.authUser, 'read', 'turnstile_scans', '', 'Recent access scans viewed.');
    return res.json({ success: true, scans: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

// ═════════════════════════════════════════════════════════════════════
// 4. DATA QUALITY STEWARD ROLE (ETL PIPELINE)
// ═════════════════════════════════════════════════════════════════════

// POST /api/roles/steward/reseed
router.post('/steward/reseed', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    await seedMultiSourceIfEmpty(true, req.authUser);
    const etlResult = await executeLiveDatabaseEtl(req.authUser);
    return res.json({
      success: true,
      message: 'Database reseeded successfully with authentic Filipino fitness screening data.',
      etlResult
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

// POST /api/roles/steward/run-etl
router.post('/steward/run-etl', requireAuth, requireRole('STEWARD', 'ADMIN'), async (req, res) => {
  try {
    await seedMultiSourceIfEmpty(false, req.authUser);
    const etlResult = await executeLiveDatabaseEtl(req.authUser);
    return res.json({
      success: true,
      message: 'Multi-source ETL Pipeline executed successfully.',
      etlResult
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

// GET /api/roles/steward/sources
router.get('/steward/sources', requireAuth, requireRole('STEWARD', 'ADMIN'), async (req, res) => {
  try {
    const crmCount = await query('SELECT COUNT(*) AS count FROM crm_members');
    const clinicCount = await query('SELECT COUNT(*) AS count FROM clinic_screenings');
    const scanCount = await query('SELECT COUNT(*) AS count FROM turnstile_scans');
    const dwCount = await query('SELECT COUNT(*) AS count FROM integrated_members_360');

    await appendAuditEvent(req.authUser, 'read', 'source_counts', '', 'Source and warehouse record counts viewed.');
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
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

router.get('/steward/latest-run', requireAuth, requireRole('STEWARD', 'ADMIN'), async (req, res) => {
  try {
    const runResult = await query(
      `SELECT run_id, status, started_at, finished_at, started_by,
              crm_rows, clinic_rows, turnstile_rows, loaded_rows,
              issue_count, orphan_count, transformation_count,
              review_queue_count, error_message
       FROM etl_pipeline_runs ORDER BY started_at DESC LIMIT 1`
    );
    if (runResult.rows.length === 0) {
      await appendAuditEvent(req.authUser, 'read', 'etl_pipeline', '', 'ETL history viewed; no run exists yet.');
      return res.json({ success: true, run: null, issues: [] });
    }

    const run = runResult.rows[0];
    const issuesResult = await query(
      `SELECT id, source_name, member_id, field_name, issue_category,
              dqm_principle, severity, issue_value, suggested_action,
              review_status, review_note, reviewed_by, reviewed_at
       FROM etl_pipeline_issues WHERE run_id = $1
       ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
                created_at ASC`,
      [run.run_id]
    );
    await appendAuditEvent(req.authUser, 'read', 'etl_pipeline', run.run_id, 'ETL run and quality issues viewed.');
    return res.json({ success: true, run, issues: issuesResult.rows });
  } catch (error) {
    console.error('Latest ETL run could not be loaded:', error.message);
    return res.status(500).json({ success: false, error: 'ETL run history is unavailable.' });
  }
});

router.put('/steward/issues/:id', requireAuth, requireRole('STEWARD', 'ADMIN'), async (req, res) => {
  try {
    const { status, note = '' } = req.body || {};
    const allowedStatuses = ['Open', 'Resolved', 'Quarantined'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Choose Open, Resolved, or Quarantined.' });
    }
    if (typeof note !== 'string' || note.length > 500) {
      return res.status(400).json({ success: false, error: 'Review note must be 500 characters or fewer.' });
    }
    if (status !== 'Open' && !note.trim()) {
      return res.status(400).json({ success: false, error: 'Add a note before resolving or quarantining an issue.' });
    }

    const result = await withTransaction(async (tx) => {
      const updatedIssue = await tx(
        `UPDATE etl_pipeline_issues
         SET review_status = $1, review_note = $2,
             reviewed_by = CASE WHEN $1 = 'Open' THEN NULL ELSE $3 END,
             reviewed_at = CASE WHEN $1 = 'Open' THEN NULL ELSE NOW() END
         WHERE id = $4 RETURNING id, review_status, review_note, reviewed_by, reviewed_at`,
        [status, note.trim(), req.authUser.id, req.params.id]
      );
      if (updatedIssue.rows[0]) {
        await appendAuditEvent(req.authUser, 'review', 'etl_pipeline_issue', req.params.id, `Status set to ${status}.`, tx);
      }
      return updatedIssue;
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'ETL issue was not found.' });
    }

    return res.json({ success: true, issue: result.rows[0] });
  } catch (error) {
    console.error('ETL issue review failed:', error.message);
    return res.status(500).json({ success: false, error: 'ETL issue could not be updated.' });
  }
});

// ═════════════════════════════════════════════════════════════════════
// 5. CLUB GENERAL MANAGER ROLE (EXECUTIVE BI)
// ═════════════════════════════════════════════════════════════════════

// GET /api/roles/manager/overview
router.get('/manager/overview', requireAuth, requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const dwRes = await query(
      `SELECT member_id, full_name, membership_tier, total_checkins, last_checkin_time,
              frequent_zone, safety_clearance_status
       FROM integrated_members_360 ORDER BY member_id ASC`
    );
    const totalMembers = dwRes.rows.length;

    const clearedCount = dwRes.rows.filter(r => r.safety_clearance_status === 'ACTIVE_CLEARANCE').length;
    const restrictedCount = totalMembers - clearedCount;

    const tierBreakdown = {};
    dwRes.rows.forEach(r => {
      tierBreakdown[r.membership_tier] = (tierBreakdown[r.membership_tier] || 0) + 1;
    });

    const recentScans = await query(
      `SELECT ts.checkin_id, ts.member_id, ts.scan_time, ts.facility_zone, ts.access_granted
       FROM turnstile_scans ts
       ORDER BY ts.scan_time DESC LIMIT 10`
    );

    const zoneRes = await query(
      `SELECT facility_zone, COUNT(*) as count FROM turnstile_scans GROUP BY facility_zone ORDER BY count DESC`
    );
    const zoneBreakdown = zoneRes.rows.map(r => ({
      zone: r.facility_zone,
      scans: Number(r.count)
    }));

    await appendAuditEvent(req.authUser, 'read', 'manager_overview', '', 'Aggregate operations dashboard accessed.');

    const managerRows = dwRes.rows.map((member) => ({
      ...member,
      safety_clearance_status: member.safety_clearance_status === 'ACTIVE_CLEARANCE'
        ? 'ACTIVE_CLEARANCE'
        : 'RESTRICTED'
    }));

    return res.json({
      success: true,
      kpis: {
        totalMembers,
        clearedCount,
        clearedPercent: totalMembers > 0 ? ((clearedCount / totalMembers) * 100).toFixed(1) : 0,
        restrictedCount,
        tierBreakdown,
        zoneBreakdown
      },
      recentScans: recentScans.rows,
      warehouse: managerRows
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

module.exports = router;

