/**
 * Reads the three source tables, runs the DQM transformations, and loads the
 * current Member 360 warehouse inside one database transaction.
 */

const { query, withTransaction } = require('./neon');
const { generateMultiSourceDatasets } = require('../generate_multisource');
const { runEtlPipeline } = require('../lib/etlEngine');
const { insertRowsInBatches } = require('./batchInsert');
const { appendAuditEvent } = require('../lib/auditLog');
const crypto = require('crypto');

const ETL_FIELD_SOURCES = [
  ['member_id', 'crm_members'],
  ['full_name', 'crm_members'],
  ['dob', 'crm_members'],
  ['email', 'crm_members'],
  ['membership_tier', 'crm_members'],
  ['parq_status', 'clinic_screenings'],
  ['resting_heart_rate', 'clinic_screenings'],
  ['assessment_date', 'clinic_screenings'],
  ['total_checkins', 'turnstile_scans'],
  ['last_checkin_time', 'turnstile_scans'],
  ['frequent_zone', 'turnstile_scans'],
  ['safety_clearance_status', 'etl_engine'],
  ['risk_tier', 'etl_engine'],
  ['dqm_flags', 'etl_engine']
];

async function seedMultiSourceIfEmpty(force = false, actor = { id: 'system', role: 'SYSTEM' }) {
  try {
    const { members, screenings, checkins } = generateMultiSourceDatasets(150);
    let seeded = false;

    await withTransaction(async (tx) => {
      const existing = await tx('SELECT COUNT(*) AS count FROM crm_members');
      if (!force && Number(existing.rows[0]?.count) > 0) return;

      if (force) {
        await tx('DELETE FROM integrated_members_360');
        await tx('DELETE FROM turnstile_scans');
        await tx('DELETE FROM clinic_screenings');
        await tx('DELETE FROM crm_members');
      }

      await insertRowsInBatches(tx, 'crm_members', [
        'member_id', 'full_name', 'dob', 'email', 'membership_tier'
      ], members.map(member => [member.member_id, member.full_name, member.dob, member.email, member.membership_tier]));

      await insertRowsInBatches(tx, 'clinic_screenings', [
        'id', 'member_id', 'parq_status', 'resting_heart_rate', 'assessment_date', 'medical_flag'
      ], screenings.map(screening => [
        crypto.randomUUID(), screening.member_id, screening.parq_status,
        screening.resting_heart_rate, screening.assessment_date, screening.medical_flag
      ]));

      await insertRowsInBatches(tx, 'turnstile_scans', [
        'id', 'checkin_id', 'member_id', 'scan_time', 'facility_zone', 'access_granted'
      ], checkins.map(checkin => [
        crypto.randomUUID(), checkin.checkin_id, checkin.member_id,
        checkin.scan_time, checkin.facility_zone, true
      ]));

      await appendAuditEvent(
        actor,
        force ? 'reseed' : 'seed',
        'multi_source_data',
        '',
        force ? 'Synthetic source tables were reseeded.' : 'Synthetic source tables were initialized.',
        tx
      );
      seeded = true;
    });

    return seeded
      ? { seeded: true, totalMembers: members.length }
      : { seeded: false, message: 'Multi-source tables already populated.' };
  } catch (error) {
    console.error('Multi-source seed failed:', error.message);
    throw new Error('Demo source data could not be prepared.');
  }
}

async function executeLiveDatabaseEtl(actor = { id: 'system', role: 'SYSTEM' }) {
  const runId = crypto.randomUUID();
  const startedBy = String(actor?.id || 'system').slice(0, 100);
  await withTransaction(async (tx) => {
    await tx(
      `INSERT INTO etl_pipeline_runs (run_id, status, started_by)
       VALUES ($1, 'running', $2)`,
      [runId, startedBy]
    );
    await appendAuditEvent(actor, 'run_started', 'etl_pipeline', runId, 'ETL pipeline started.', tx);
  });

  try {
    const [membersRes, screeningsRes, checkinsRes] = await Promise.all([
      query('SELECT * FROM crm_members ORDER BY member_id ASC'),
      query('SELECT * FROM clinic_screenings ORDER BY member_id ASC, assessment_date ASC, created_at ASC'),
      query('SELECT * FROM turnstile_scans ORDER BY scan_time DESC')
    ]);

    const membersRaw = membersRes.rows.map(member => ({
      member_id: member.member_id,
      full_name: member.full_name,
      dob: member.dob,
      email: member.email,
      membership_tier: member.membership_tier
    }));

    const screeningsRaw = screeningsRes.rows.map(screening => ({
      member_id: screening.member_id,
      parq_status: screening.parq_status,
      resting_heart_rate: screening.resting_heart_rate,
      assessment_date: screening.assessment_date,
      medical_flag: screening.medical_flag
    }));

    const checkinsRaw = checkinsRes.rows.map(checkin => ({
      checkin_id: checkin.checkin_id,
      member_id: checkin.member_id,
      checkin_time: checkin.scan_time,
      facility_zone: checkin.facility_zone,
      gate_status: checkin.access_granted ? 'GRANTED' : 'DENIED'
    }));

    const etlResult = runEtlPipeline(membersRaw, screeningsRaw, checkinsRaw);

    await withTransaction(async (tx) => {
      await tx('DELETE FROM integrated_members_360');

      const warehouseRows = etlResult.integratedRecords.map(record => [
        record.member_id, record.full_name, record.dob, record.email, record.membership_tier,
        record.parq_status, record.resting_heart_rate, record.assessment_date,
        record.total_checkins, record.last_checkin_time, record.frequent_zone,
        record.safety_clearance_status, record.risk_tier, record.dqm_flags_count,
        record.dqm_flags, runId
      ]);
      await insertRowsInBatches(tx, 'integrated_members_360', [
        'member_id', 'full_name', 'dob', 'email', 'membership_tier', 'parq_status',
        'resting_heart_rate', 'assessment_date', 'total_checkins', 'last_checkin_time',
        'frequent_zone', 'safety_clearance_status', 'risk_tier', 'dqm_flags_count',
        'dqm_flags', 'pipeline_run_id'
      ], warehouseRows);

      const issueRows = etlResult.dqmIssues.map(issue => [
        runId,
        String(issue.source || 'ETL').slice(0, 100),
        issue.member_id || null,
        String(issue.field || 'record').slice(0, 100),
        String(issue.category || 'Data quality issue').slice(0, 150),
        String(issue.dqmPrinciple || 'Accuracy').slice(0, 50),
        issue.severity || 'Medium',
        String(issue.value ?? '').slice(0, 1000),
        String(issue.action || '').slice(0, 500)
      ]);
      await insertRowsInBatches(tx, 'etl_pipeline_issues', [
        'run_id', 'source_name', 'member_id', 'field_name', 'issue_category',
        'dqm_principle', 'severity', 'issue_value', 'suggested_action'
      ], issueRows);

      const lineageRows = etlResult.integratedRecords.flatMap(record =>
        ETL_FIELD_SOURCES.map(([fieldName, sourceName]) => [
          runId, record.member_id, fieldName, sourceName, record.member_id
        ])
      );
      await insertRowsInBatches(tx, 'etl_field_lineage', [
        'run_id', 'member_id', 'field_name', 'source_name', 'source_key'
      ], lineageRows);

      await tx(
        `UPDATE etl_pipeline_runs
         SET status = 'succeeded', finished_at = NOW(), crm_rows = $2,
             clinic_rows = $3, turnstile_rows = $4, loaded_rows = $5,
             issue_count = $6, orphan_count = $7, transformation_count = $8,
             review_queue_count = $9
         WHERE run_id = $1`,
        [
          runId,
          membersRaw.length,
          screeningsRaw.length,
          checkinsRaw.length,
          etlResult.integratedRecords.length,
          etlResult.dqmIssues.length,
          etlResult.orphanCheckins.length,
          etlResult.metrics.transformations.totalChanges,
          etlResult.reviewQueue.length
        ]
      );

      await appendAuditEvent(actor, 'run', 'etl_pipeline', runId, 'Multi-source ETL completed.', tx);
    });

    return { ...etlResult, runId };
  } catch (error) {
    console.error('ETL run failed:', error.message);
    await withTransaction(async (tx) => {
      await tx(
        `UPDATE etl_pipeline_runs
         SET status = 'failed', finished_at = NOW(), error_message = $2
         WHERE run_id = $1`,
        [runId, String(error.message || 'ETL failed').slice(0, 500)]
      );
      await appendAuditEvent(actor, 'run_failed', 'etl_pipeline', runId, 'The ETL pipeline failed.', tx);
    });
    throw new Error('The ETL run failed. The previous warehouse data was preserved.');
  }
}

module.exports = {
  seedMultiSourceIfEmpty,
  executeLiveDatabaseEtl
};
