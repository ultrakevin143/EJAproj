/**
 * Export Route
 * GET /api/export/:sessionId/:type
 *
 * Types:
 *   raw-csv         — original uploaded CSV
 *   cleaned-csv     — cleaned/standardized CSV
 *   error-log-csv   — DQM error log
 *   review-queue-csv — human review queue
 *   summary-json    — full audit JSON report
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db/neon');
const { stringify } = require('csv-stringify/sync');
const { generateRecords, recordsToCSV } = require('../generate_dataset');

// GET /api/export/:sessionId/:type
router.get('/:sessionId/:type', async (req, res) => {
  const { sessionId, type } = req.params;

  try {
    switch (type) {
      case 'raw-csv': {
        const result = await query(
          `SELECT row_number, member_name AS "Name", dob AS "DOB", email AS "Email",
                  screening_result AS "Screening Result", date_recorded AS "Date Recorded"
           FROM audit_records WHERE session_id = $1 ORDER BY row_number ASC`,
          [sessionId]
        );
        const csvStr = stringify(result.rows.map(r => ({
          Name: r.Name, DOB: r.DOB, Email: r.Email,
          'Screening Result': r['Screening Result'], 'Date Recorded': r['Date Recorded']
        })), { header: true });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="original_raw_dataset.csv"`);
        return res.send(csvStr);
      }

      case 'cleaned-csv': {
        const result = await query(
          `SELECT row_number, member_name AS "Name", dob AS "DOB", email AS "Email",
                  screening_result AS "Screening Result", date_recorded AS "Date Recorded"
           FROM cleaned_records WHERE session_id = $1 ORDER BY row_number ASC`,
          [sessionId]
        );
        if (result.rows.length === 0) {
          return res.status(400).send('Cleaned dataset not available. Please apply safe standardizations first.');
        }
        const csvStr = stringify(result.rows.map(r => ({
          Name: r.Name, DOB: r.DOB, Email: r.Email,
          'Screening Result': r['Screening Result'], 'Date Recorded': r['Date Recorded']
        })), { header: true });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="cleaned_standardized_dataset.csv"`);
        return res.send(csvStr);
      }

      case 'error-log-csv': {
        const result = await query(
          `SELECT row_number, field_name, original_value, issue_category, primary_principle,
                  dqm_principles, severity, auto_fixable, suggested_action
           FROM audit_errors WHERE session_id = $1 ORDER BY row_number ASC`,
          [sessionId]
        );
        const exportRows = result.rows.map(e => ({
          'Row Number': e.row_number,
          'Field Name': e.field_name,
          'Original Value': e.original_value,
          'Issue Category': e.issue_category,
          'Primary DQM Principle': e.primary_principle,
          'DQM Principles': (e.dqm_principles || []).join('; '),
          'Severity': e.severity,
          'Auto Fixable': e.auto_fixable ? 'Yes' : 'No',
          'Suggested Action': e.suggested_action
        }));
        const csvStr = stringify(exportRows, { header: true });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="dqm_error_log.csv"`);
        return res.send(csvStr);
      }

      case 'review-queue-csv': {
        const result = await query(
          `SELECT id, row_number, field_name, current_value, issue_category, primary_principle,
                  reason_for_review, suggested_action, status, notes, manual_value
           FROM review_queue WHERE session_id = $1 ORDER BY row_number ASC`,
          [sessionId]
        );
        const exportRows = result.rows.map(q => ({
          'ID': q.id,
          'Row Number': q.row_number,
          'Field': q.field_name,
          'Current Value': q.current_value,
          'Issue Category': q.issue_category,
          'DQM Principle': q.primary_principle,
          'Reason for Review': q.reason_for_review,
          'Suggested Action': q.suggested_action,
          'Status': q.status,
          'Notes': q.notes || '',
          'Manual Value': q.manual_value || ''
        }));
        const csvStr = stringify(exportRows, { header: true });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="dqm_human_review_queue.csv"`);
        return res.send(csvStr);
      }

      case 'summary-json': {
        const sessionRes = await query(`SELECT * FROM audit_sessions WHERE id = $1`, [sessionId]);
        const govRes = await query(`SELECT rule_name FROM governance_rules WHERE is_active = TRUE`);
        if (sessionRes.rows.length === 0) {
          return res.status(404).send('Session not found.');
        }
        const s = sessionRes.rows[0];
        const report = {
          application: 'Gym Member Health Screening — DQM Checker',
          industry: 'Fitness & Gym Health Screening',
          generatedAt: new Date().toISOString(),
          sessionId,
          datasetFile: s.file_name,
          uploadedAt: s.uploaded_at,
          auditSummary: {
            totalRecords: s.total_records,
            totalFields: s.total_fields,
            issueEvents: s.total_issue_events,
            uniqueAffectedRecords: s.unique_affected_records,
            affectedPercent: parseFloat(s.affected_percent),
            status: s.status
          },
          activeGovernancePolicies: govRes.rows.map(r => r.rule_name)
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="dqm_audit_summary_report.json"`);
        return res.send(JSON.stringify(report, null, 2));
      }

      case 'sample-template': {
        const records = generateRecords(500);
        const csvStr = recordsToCSV(records);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sample_gym_dataset.csv"`);
        return res.send(csvStr);
      }

      default:
        return res.status(400).send('Invalid export type specified.');
    }
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).send(`Export failed: ${err.message}`);
  }
});

module.exports = router;

