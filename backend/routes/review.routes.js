/**
 * Data steward review queue routes for CSV audit sessions.
 */

const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db/neon');
const { requireAuth, requireRole } = require('../middleware/auth');
const { parseDateDetails, todayIsoDate, isValidEmail, validateName } = require('../lib/auditEngine');
const { SCREENING_RESULT_ABBR_MAP, VALID_SCREENING_RESULTS } = require('../lib/dqmClassifier');
const { appendAuditEvent } = require('../lib/auditLog');

router.use(requireAuth, requireRole('STEWARD', 'ADMIN'));

function normalizeManualValue(field, value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const cleaned = value.trim();

  if (field === 'Name') {
    return validateName(cleaned).isIncomplete ? null : cleaned.replace(/\s+/g, ' ');
  }
  if (field === 'DOB' || field === 'Date Recorded') {
    const parsed = parseDateDetails(cleaned);
    if (!parsed.isValid || parsed.formattedIso > todayIsoDate()) return null;
    return parsed.formattedIso;
  }
  if (field === 'Email') {
    return isValidEmail(cleaned) ? cleaned.toLowerCase() : null;
  }
  if (field === 'Screening Result') {
    const lower = cleaned.toLowerCase();
    const expanded = SCREENING_RESULT_ABBR_MAP[lower] || lower;
    if (!VALID_SCREENING_RESULTS.includes(expanded.toLowerCase())) return null;
    return expanded.charAt(0).toUpperCase() + expanded.slice(1).toLowerCase();
  }
  return null;
}

router.get('/:sessionId', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM review_queue WHERE session_id = $1 ORDER BY row_number ASC, created_at ASC`,
      [req.params.sessionId]
    );

    await appendAuditEvent(req.authUser, 'read', 'csv_review_queue', req.params.sessionId, 'CSV quality review items viewed.');
    return res.json({
      success: true,
      reviewQueue: result.rows.map(q => ({
        id: q.id,
        rowNumber: q.row_number,
        rowIndex: q.row_index,
        field: q.field_name,
        currentValue: q.current_value,
        category: q.issue_category,
        primaryPrinciple: q.primary_principle,
        dqmPrinciples: q.dqm_principles,
        severity: q.severity,
        reasonForReview: q.reason_for_review,
        suggestedNextAction: q.suggested_action,
        status: q.status,
        notes: q.notes,
        manualValue: q.manual_value,
        reviewedBy: q.reviewed_by,
        reviewedAt: q.reviewed_at
      }))
    });
  } catch (error) {
    console.error('Review queue fetch failed:', error.message);
    return res.status(500).json({ success: false, error: 'Review items are unavailable.' });
  }
});

router.post('/:sessionId/update', async (req, res) => {
  try {
    const { id, status, notes, manualValue } = req.body || {};
    if (typeof id !== 'string' || !id.trim()) {
      return res.status(400).json({ success: false, error: 'Review item ID is required.' });
    }

    const allowedStatuses = ['Pending', 'Reviewed', 'Approved', 'Rejected'];
    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Choose a valid review status.' });
    }
    if (notes !== undefined && (typeof notes !== 'string' || notes.length > 500)) {
      return res.status(400).json({ success: false, error: 'Review notes must be 500 characters or fewer.' });
    }
    if (manualValue !== undefined && (typeof manualValue !== 'string' || manualValue.length > 500)) {
      return res.status(400).json({ success: false, error: 'Corrected values must be 500 characters or fewer.' });
    }

    const existingResult = await query(
      `SELECT * FROM review_queue WHERE id = $1 AND session_id = $2`,
      [id.trim(), req.params.sessionId]
    );
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Review item not found.' });
    }

    const existing = existingResult.rows[0];
    const nextStatus = status || existing.status;
    const submittedValue = manualValue === undefined ? existing.manual_value : manualValue;
    const normalizedValue = submittedValue ? normalizeManualValue(existing.field_name, submittedValue) : '';

    if (submittedValue && normalizedValue === null) {
      return res.status(400).json({ success: false, error: 'The corrected value does not pass validation for this field.' });
    }
    if (nextStatus === 'Approved' && !normalizedValue) {
      return res.status(400).json({ success: false, error: 'Enter a valid corrected value before approving this item.' });
    }

    const result = await withTransaction(async (tx) => {
      const updatedResult = await tx(
        `UPDATE review_queue
         SET status = $1,
             notes = $2,
             manual_value = $3,
             reviewed_by = CASE WHEN $1 = 'Pending' THEN NULL ELSE $4 END,
             reviewed_at = CASE WHEN $1 = 'Pending' THEN NULL ELSE NOW() END
         WHERE id = $5 AND session_id = $6
         RETURNING *`,
        [nextStatus, notes === undefined ? existing.notes : notes.trim(), normalizedValue || '', req.authUser.id, id.trim(), req.params.sessionId]
      );
      if (updatedResult.rows[0]) {
        await appendAuditEvent(req.authUser, 'review', 'csv_quality_issue', updatedResult.rows[0].id, `Status set to ${updatedResult.rows[0].status}.`, tx);
      }
      return updatedResult;
    });

    const updated = result.rows[0];
    return res.json({
      success: true,
      message: 'Review item updated.',
      item: {
        id: updated.id,
        rowNumber: updated.row_number,
        field: updated.field_name,
        currentValue: updated.current_value,
        status: updated.status,
        notes: updated.notes,
        manualValue: updated.manual_value,
        reviewedBy: updated.reviewed_by,
        reviewedAt: updated.reviewed_at
      }
    });
  } catch (error) {
    console.error('Review update failed:', error.message);
    return res.status(500).json({ success: false, error: 'Review item could not be updated.' });
  }
});

module.exports = router;
