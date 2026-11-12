/**
 * Multi-Source Database Service & Role Operations
 * Manages Source 1 (CRM), Source 2 (Clinic), Source 3 (Turnstile IoT),
 * and Target Data Warehouse (Integrated Member 360) in PostgreSQL.
 */

const { query } = require('./neon');
const { generateMultiSourceDatasets } = require('../generate_multisource');
const { runEtlPipeline } = require('../lib/etlEngine');
const crypto = require('crypto');

/**
 * Seed initial multi-source data if empty
 */
async function seedMultiSourceIfEmpty(force = false) {
  try {
    const existing = await query('SELECT COUNT(*) AS count FROM crm_members');
    if (!force && Number(existing.rows[0]?.count) > 0) {
      return { seeded: false, message: 'Multi-source tables already populated.' };
    }

    if (force) {
      await query('DELETE FROM integrated_members_360');
      await query('DELETE FROM turnstile_scans');
      await query('DELETE FROM clinic_screenings');
      await query('DELETE FROM crm_members');
    }

    console.log('🌱 Seeding multi-source tables with authentic Filipino datasets...');
    const { members, screenings, checkins } = generateMultiSourceDatasets(150);

    // 1. Seed CRM Members
    for (const m of members) {
      await query(
        `INSERT INTO crm_members (member_id, full_name, dob, email, membership_tier)
         VALUES ($1, $2, $3, $4, $5)`,
        [m.member_id, m.full_name, m.dob, m.email, m.membership_tier]
      );
    }

    // 2. Seed Clinic Screenings
    for (const s of screenings) {
      await query(
        `INSERT INTO clinic_screenings (id, member_id, parq_status, resting_heart_rate, assessment_date, medical_flag)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [crypto.randomUUID(), s.member_id, s.parq_status, s.resting_heart_rate, s.assessment_date, s.medical_flag]
      );
    }

    // 3. Seed Turnstile Scans
    for (const c of checkins) {
      await query(
        `INSERT INTO turnstile_scans (id, checkin_id, member_id, scan_time, facility_zone, access_granted)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [crypto.randomUUID(), c.checkin_id, c.member_id, c.checkin_time, c.facility_zone, true]
      );
    }

    // 4. Run initial ETL integration to populate Data Warehouse
    const etlResult = runEtlPipeline(members, screenings, checkins);
    for (const r of etlResult.integratedRecords) {
      await query(
        `INSERT INTO integrated_members_360
           (member_id, full_name, dob, email, membership_tier, parq_status,
            resting_heart_rate, assessment_date, total_checkins, last_checkin_time,
            frequent_zone, safety_clearance_status, risk_tier, dqm_flags_count, dqm_flags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          r.member_id, r.full_name, r.dob, r.email, r.membership_tier, r.parq_status,
          r.resting_heart_rate, r.assessment_date, r.total_checkins, r.last_checkin_time,
          r.frequent_zone, r.safety_clearance_status, r.risk_tier, r.dqm_flags_count, r.dqm_flags
        ]
      );
    }

    console.log(`✅ Multi-source seeding complete: ${members.length} members integrated into Data Warehouse.`);
    return { seeded: true, totalMembers: members.length };
  } catch (err) {
    console.warn('Multi-source seed warning:', err.message);
    return { seeded: false, error: err.message };
  }
}

/**
 * Execute a live ETL Run on the database records
 */
async function executeLiveDatabaseEtl() {
  const membersRes = await query('SELECT * FROM crm_members ORDER BY member_id ASC');
  const screeningsRes = await query('SELECT * FROM clinic_screenings ORDER BY member_id ASC');
  const checkinsRes = await query('SELECT * FROM turnstile_scans ORDER BY scan_time DESC');

  const membersRaw = membersRes.rows.map(m => ({
    member_id: m.member_id,
    full_name: m.full_name,
    dob: m.dob,
    email: m.email,
    membership_tier: m.membership_tier
  }));

  const screeningsRaw = screeningsRes.rows.map(s => ({
    member_id: s.member_id,
    parq_status: s.parq_status,
    resting_heart_rate: s.resting_heart_rate,
    assessment_date: s.assessment_date,
    medical_flag: s.medical_flag
  }));

  const checkinsRaw = checkinsRes.rows.map(c => ({
    checkin_id: c.checkin_id,
    member_id: c.member_id,
    checkin_time: c.scan_time,
    facility_zone: c.facility_zone,
    gate_status: c.access_granted ? 'GRANTED' : 'DENIED'
  }));

  const etlResult = runEtlPipeline(membersRaw, screeningsRaw, checkinsRaw);

  // Clear and reload Data Warehouse
  await query('DELETE FROM integrated_members_360');
  for (const r of etlResult.integratedRecords) {
    await query(
      `INSERT INTO integrated_members_360
         (member_id, full_name, dob, email, membership_tier, parq_status,
          resting_heart_rate, assessment_date, total_checkins, last_checkin_time,
          frequent_zone, safety_clearance_status, risk_tier, dqm_flags_count, dqm_flags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        r.member_id, r.full_name, r.dob, r.email, r.membership_tier, r.parq_status,
        r.resting_heart_rate, r.assessment_date, r.total_checkins, r.last_checkin_time,
        r.frequent_zone, r.safety_clearance_status, r.risk_tier, r.dqm_flags_count, r.dqm_flags
      ]
    );
  }

  return etlResult;
}

module.exports = {
  seedMultiSourceIfEmpty,
  executeLiveDatabaseEtl
};

