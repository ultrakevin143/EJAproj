/**
 * Session Service
 * Handles persisting audit session data into PostgreSQL.
 */

const crypto = require('crypto');
const { withTransaction } = require('./neon');
const { insertRowsInBatches } = require('./batchInsert');
const { appendAuditEvent } = require('../lib/auditLog');

/**
 * Persist a completed audit to the database.
 * Creates: audit_sessions, audit_records, audit_errors rows.
 *
 * @param {string} fileName
 * @param {string} csvContent - raw CSV string
 * @param {object} auditResult - result from auditDataset()
 * @param {object} actor - authenticated account that uploaded the dataset
 * @param {{action?: string, details?: string}} audit - audit event description
 * @returns {object} - the created session row
 */
async function persistSession(fileName, csvContent, auditResult, actor, audit = {}) {
  const { summary, errorLog, records, duplicateRows = [] } = auditResult;
  const sessionId = crypto.randomUUID();
  const duplicateRowNumbers = new Set(duplicateRows.map(row => row.rowNumber));

  return withTransaction(async (tx) => {
    const sessionRes = await tx(
      `INSERT INTO audit_sessions
         (id, file_name, total_records, total_fields, total_issue_events,
          unique_affected_records, affected_percent, consistency_patterns, duplicate_rows, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active')
       RETURNING *`,
      [
        sessionId,
        String(fileName || 'uploaded_dataset.csv').slice(0, 255),
        summary.totalRecords,
        summary.totalFields,
        summary.issueEvents,
        summary.uniqueAffectedRecords,
        summary.affectedRecordsPercent,
        summary.consistencyPatternsCount,
        summary.duplicateRowsCount
      ]
    );
    const session = sessionRes.rows[0];

    const recordRows = records.map((row, index) => [
      crypto.randomUUID(), session.id, index + 1,
      row['Name'] ?? '', row['DOB'] ?? '', row['Email'] ?? '',
      row['Screening Result'] ?? '', row['Date Recorded'] ?? '',
      duplicateRowNumbers.has(index + 1)
    ]);
    await insertRowsInBatches(tx, 'audit_records', [
      'id', 'session_id', 'row_number', 'member_name', 'dob', 'email',
      'screening_result', 'date_recorded', 'is_duplicate'
    ], recordRows);

    const issueRows = errorLog.map(issue => [
      crypto.randomUUID(), session.id, issue.rowNumber, issue.rowIndex,
      issue.fieldName, issue.originalValue, issue.issueCategory,
      issue.primaryPrinciple, issue.dqmPrinciples, issue.severity,
      issue.autoFixable, issue.suggestedAction, issue.reason
    ]);
    await insertRowsInBatches(tx, 'audit_errors', [
      'id', 'session_id', 'row_number', 'row_index', 'field_name', 'original_value',
      'issue_category', 'primary_principle', 'dqm_principles', 'severity',
      'auto_fixable', 'suggested_action', 'reason'
    ], issueRows);

    await appendAuditEvent(
      actor,
      audit.action || 'upload',
      'audit_session',
      session.id,
      audit.details || `Imported ${summary.totalRecords} CSV rows.`,
      tx
    );

    return session;
  });
}

module.exports = { persistSession };
