/**
 * Session Service
 * Handles persisting audit session data into PostgreSQL.
 */

const crypto = require('crypto');
const { query } = require('./neon');

/**
 * Persist a completed audit to the database.
 * Creates: audit_sessions, audit_records, audit_errors rows.
 *
 * @param {string} fileName
 * @param {string} csvContent - raw CSV string
 * @param {object} auditResult - result from auditDataset()
 * @returns {object} - the created session row
 */
async function persistSession(fileName, csvContent, auditResult) {
  const { summary, errorLog, records } = auditResult;
  const sessionId = crypto.randomUUID();

  // 1. Insert session header
  const sessionRes = await query(
    `INSERT INTO audit_sessions
       (id, file_name, total_records, total_fields, total_issue_events,
        unique_affected_records, affected_percent, consistency_patterns, duplicate_rows, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active')
     RETURNING *`,
    [
      sessionId,
      fileName,
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

  // 2. Bulk insert raw records
  for (const [i, row] of records.entries()) {
    await query(
      `INSERT INTO audit_records
         (id, session_id, row_number, member_name, dob, email, screening_result, date_recorded, is_duplicate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        crypto.randomUUID(),
        session.id,
        i + 1,
        row['Name'] ?? '',
        row['DOB'] ?? '',
        row['Email'] ?? '',
        row['Screening Result'] ?? '',
        row['Date Recorded'] ?? '',
        false
      ]
    );
  }

  // 3. Bulk insert error log
  for (const err of errorLog) {
    await query(
      `INSERT INTO audit_errors
         (id, session_id, row_number, row_index, field_name, original_value, issue_category,
          primary_principle, dqm_principles, severity, auto_fixable, suggested_action, reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        crypto.randomUUID(),
        session.id,
        err.rowNumber,
        err.rowIndex,
        err.fieldName,
        err.originalValue,
        err.issueCategory,
        err.primaryPrinciple,
        err.dqmPrinciples,
        err.severity,
        err.autoFixable,
        err.suggestedAction,
        err.reason
      ]
    );
  }

  return session;
}

module.exports = { persistSession };
