/**
 * Audit Route
 * GET /api/audit/:sessionId  — retrieve audit data for a session
 * GET /api/audit/latest      — retrieve the most recent session's audit
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db/neon');
const { CLASSROOM_BASELINE } = require('../lib/dqmClassifier');

// GET /api/audit/latest
router.get('/latest', async (req, res) => {
  try {
    const sessionRes = await query(
      `SELECT * FROM audit_sessions ORDER BY uploaded_at DESC LIMIT 1`
    );
    if (sessionRes.rows.length === 0) {
      return res.json({
        hasData: false,
        message: 'No dataset has been uploaded or generated yet.',
        baseline: CLASSROOM_BASELINE
      });
    }

    const session = sessionRes.rows[0];
    const errorsRes = await query(
      `SELECT * FROM audit_errors WHERE session_id = $1 ORDER BY row_number ASC`,
      [session.id]
    );
    const consistencyRes = await query(
      `SELECT COUNT(*) AS count FROM audit_errors WHERE session_id = $1 AND issue_category = 'Mixed Date Format'`,
      [session.id]
    );

    // Build category & DQM counts from stored errors
    const categoryCounts = {};
    const dqmCounts = { Accuracy: 0, Consistency: 0, Completeness: 0, Timeliness: 0, Reliability: 0, Relevance: 0 };
    errorsRes.rows.forEach(e => {
      categoryCounts[e.issue_category] = (categoryCounts[e.issue_category] || 0) + 1;
      (e.dqm_principles || []).forEach(p => { dqmCounts[p] = (dqmCounts[p] || 0) + 1; });
    });

    return res.json({
      hasData: true,
      sessionId: session.id,
      fileName: session.file_name,
      uploadedAt: session.uploaded_at,
      status: session.status,
      summary: {
        totalRecords: session.total_records,
        totalFields: session.total_fields,
        issueEvents: session.total_issue_events,
        uniqueAffectedRecords: session.unique_affected_records,
        affectedRecordsPercent: parseFloat(session.affected_percent),
        consistencyPatternsCount: session.consistency_patterns,
        duplicateRowsCount: session.duplicate_rows,
        categoryCounts,
        dqmCounts
      },
      errorLog: errorsRes.rows.map(e => ({
        id: e.id,
        rowNumber: e.row_number,
        rowIndex: e.row_index,
        fieldName: e.field_name,
        originalValue: e.original_value,
        issueCategory: e.issue_category,
        primaryPrinciple: e.primary_principle,
        dqmPrinciples: e.dqm_principles,
        severity: e.severity,
        autoFixable: e.auto_fixable,
        suggestedAction: e.suggested_action
      })),
      baseline: CLASSROOM_BASELINE
    });
  } catch (err) {
    console.error('Audit/latest error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/audit/:sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionRes = await query(
      `SELECT * FROM audit_sessions WHERE id = $1`,
      [sessionId]
    );
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    const session = sessionRes.rows[0];
    const errorsRes = await query(
      `SELECT * FROM audit_errors WHERE session_id = $1 ORDER BY row_number ASC`,
      [sessionId]
    );

    const categoryCounts = {};
    const dqmCounts = { Accuracy: 0, Consistency: 0, Completeness: 0, Timeliness: 0, Reliability: 0, Relevance: 0 };
    errorsRes.rows.forEach(e => {
      categoryCounts[e.issue_category] = (categoryCounts[e.issue_category] || 0) + 1;
      (e.dqm_principles || []).forEach(p => { dqmCounts[p] = (dqmCounts[p] || 0) + 1; });
    });

    return res.json({
      success: true,
      hasData: true,
      sessionId: session.id,
      fileName: session.file_name,
      uploadedAt: session.uploaded_at,
      status: session.status,
      summary: {
        totalRecords: session.total_records,
        totalFields: session.total_fields,
        issueEvents: session.total_issue_events,
        uniqueAffectedRecords: session.unique_affected_records,
        affectedRecordsPercent: parseFloat(session.affected_percent),
        consistencyPatternsCount: session.consistency_patterns,
        duplicateRowsCount: session.duplicate_rows,
        categoryCounts,
        dqmCounts
      },
      errorLog: errorsRes.rows.map(e => ({
        id: e.id,
        rowNumber: e.row_number,
        rowIndex: e.row_index,
        fieldName: e.field_name,
        originalValue: e.original_value,
        issueCategory: e.issue_category,
        primaryPrinciple: e.primary_principle,
        dqmPrinciples: e.dqm_principles,
        severity: e.severity,
        autoFixable: e.auto_fixable,
        suggestedAction: e.suggested_action
      })),
      baseline: CLASSROOM_BASELINE
    });
  } catch (err) {
    console.error('Audit/:sessionId error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

