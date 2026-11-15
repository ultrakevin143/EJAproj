/**
 * Clean Route
 * POST /api/clean/:sessionId  — apply safe standardizations, persist cleaned records
 * GET  /api/clean/:sessionId/compare — before vs after comparison
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, withTransaction } = require('../db/neon');
const { insertRowsInBatches } = require('../db/batchInsert');
const { auditDataset } = require('../lib/auditEngine');
const { applySafeCleaning } = require('../lib/cleanEngine');
const { requireAuth, requireRole } = require('../middleware/auth');
const { appendAuditEvent } = require('../lib/auditLog');

router.use(requireAuth, requireRole('STEWARD', 'ADMIN'));

// POST /api/clean/:sessionId
router.post('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Load original records from DB
    const recordsRes = await query(
      `SELECT * FROM audit_records WHERE session_id = $1 ORDER BY row_number ASC`,
      [sessionId]
    );
    if (recordsRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session records not found.' });
    }

    // Load original errors from DB
    const errorsRes = await query(
      `SELECT * FROM audit_errors WHERE session_id = $1 ORDER BY row_number ASC`,
      [sessionId]
    );

    // Map DB rows back to the format the audit engine uses
    const records = recordsRes.rows.map(r => ({
      Name: r.member_name,
      DOB: r.dob,
      Email: r.email,
      'Screening Result': r.screening_result,
      'Date Recorded': r.date_recorded
    }));

    const errorLog = errorsRes.rows.map(e => ({
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
      suggestedAction: e.suggested_action,
      reason: e.reason
    }));

    // Load existing review queue statuses
    const queueRes = await query(
      `SELECT * FROM review_queue WHERE session_id = $1`,
      [sessionId]
    );
    const existingQueue = queueRes.rows.map(q => ({
      rowNumber: q.row_number,
      field: q.field_name,
      status: q.status,
      notes: q.notes,
      manualValue: q.manual_value,
      reviewedBy: q.reviewed_by
    }));

    const { cleanedRows, reviewQueue, changelog, summary } = applySafeCleaning(records, errorLog, existingQueue);

    // Persist cleaned records
    await withTransaction(async (tx) => {
      await tx(`DELETE FROM cleaned_records WHERE session_id = $1`, [sessionId]);
      const changedRows = new Set(changelog.map(change => change.rowNumber));
      const cleanedRecordRows = cleanedRows.map((row, index) => [
        crypto.randomUUID(), sessionId, index + 1,
        row['Name'], row['DOB'], row['Email'], row['Screening Result'], row['Date Recorded'],
        changedRows.has(index + 1)
      ]);
      await insertRowsInBatches(tx, 'cleaned_records', [
        'id', 'session_id', 'row_number', 'member_name', 'dob', 'email',
        'screening_result', 'date_recorded', 'was_modified'
      ], cleanedRecordRows);

      await tx(`DELETE FROM review_queue WHERE session_id = $1`, [sessionId]);
      const reviewRows = reviewQueue.map(item => [
        crypto.randomUUID(), sessionId, item.rowNumber, item.rowIndex, item.field, item.currentValue,
        item.category, item.primaryPrinciple, item.dqmPrinciples, item.severity,
        item.reasonForReview, item.suggestedNextAction,
        item.status, item.notes, item.manualValue, item.reviewedBy || null
      ]);
      await insertRowsInBatches(tx, 'review_queue', [
        'id', 'session_id', 'row_number', 'row_index', 'field_name', 'current_value',
        'issue_category', 'primary_principle', 'dqm_principles', 'severity',
        'reason_for_review', 'suggested_action', 'status', 'notes', 'manual_value', 'reviewed_by'
      ], reviewRows);

      const changeRows = changelog.map(change => [
        crypto.randomUUID(), sessionId, change.rowNumber, change.field,
        String(change.originalValue ?? ''), String(change.newValue ?? ''),
        String(change.rule || '').slice(0, 200), String(change.type || '').slice(0, 80), req.authUser.id
      ]);
      await insertRowsInBatches(tx, 'cleaning_change_log', [
        'id', 'session_id', 'row_number', 'field_name', 'original_value', 'new_value',
        'rule_name', 'change_type', 'changed_by'
      ], changeRows);

      await tx(`UPDATE audit_sessions SET status = 'cleaned' WHERE id = $1`, [sessionId]);
      await appendAuditEvent(req.authUser, 'clean', 'audit_session', sessionId, `Applied ${summary.totalAutomatedChanges} changes.`, tx);
    });

    return res.json({
      success: true,
      message: `Applied ${summary.totalAutomatedChanges} safe standardizations. ${summary.humanReviewItemsCount} items routed to Human Review Queue.`,
      summary,
      changelog,
      reviewQueueCount: reviewQueue.length
    });
  } catch (err) {
    console.error('Clean error:', err);
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

// GET /api/clean/:sessionId/compare
router.get('/:sessionId/compare', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionRes = await query(`SELECT * FROM audit_sessions WHERE id = $1`, [sessionId]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }
    const session = sessionRes.rows[0];

    const cleanedRes = await query(
      `SELECT * FROM cleaned_records WHERE session_id = $1 ORDER BY row_number ASC`,
      [sessionId]
    );

    if (cleanedRes.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Cleaning has not been applied to this session yet.' });
    }

    const cleanedRows = cleanedRes.rows.map(r => ({
      Name: r.member_name,
      DOB: r.dob,
      Email: r.email,
      'Screening Result': r.screening_result,
      'Date Recorded': r.date_recorded
    }));

    const cleanedAudit = auditDataset(cleanedRows);
    const origSum = {
      issueEvents: session.total_issue_events,
      uniqueAffectedRecords: session.unique_affected_records,
      affectedRecordsPercent: parseFloat(session.affected_percent)
    };
    const newSum = cleanedAudit.summary;

    await appendAuditEvent(req.authUser, 'read', 'cleaning_comparison', sessionId, 'Before and after quality summary viewed.');

    return res.json({
      success: true,
      comparison: {
        originalIssueEvents: origSum.issueEvents,
        newIssueEvents: newSum.issueEvents,
        issueEventsResolved: origSum.issueEvents - newSum.issueEvents,
        originalAffectedRecords: origSum.uniqueAffectedRecords,
        newAffectedRecords: newSum.uniqueAffectedRecords,
        affectedRecordsResolved: origSum.uniqueAffectedRecords - newSum.uniqueAffectedRecords,
        percentReduction:
          origSum.issueEvents > 0
            ? parseFloat((((origSum.issueEvents - newSum.issueEvents) / origSum.issueEvents) * 100).toFixed(2))
            : 0,
        originalCategories: {},
        newCategories: newSum.categoryCounts,
        originalDqm: {},
        newDqm: newSum.dqmCounts
      },
      cleanedAudit: newSum
    });
  } catch (err) {
    console.error('Compare error:', err);
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

module.exports = router;

