/**
 * Review Queue Route
 * GET  /api/review/:sessionId        — fetch all review items for a session
 * POST /api/review/:sessionId/update — update a single review item's status
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db/neon');

// GET /api/review/:sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await query(
      `SELECT * FROM review_queue WHERE session_id = $1 ORDER BY row_number ASC, created_at ASC`,
      [sessionId]
    );

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
        reviewedAt: q.reviewed_at
      }))
    });
  } catch (err) {
    console.error('Review queue fetch error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/review/:sessionId/update
router.post('/:sessionId/update', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { id, status, notes, manualValue } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Review item ID is required.' });
    }

    // Build dynamic SET clause
    const updates = [];
    const values = [];
    let idx = 1;

    if (status) {
      updates.push(`status = $${idx++}`);
      values.push(status);
      if (status === 'Reviewed' || status === 'Approved' || status === 'Rejected') {
        updates.push(`reviewed_at = NOW()`);
      }
    }
    if (notes !== undefined) {
      updates.push(`notes = $${idx++}`);
      values.push(notes);
    }
    if (manualValue !== undefined) {
      updates.push(`manual_value = $${idx++}`);
      values.push(manualValue);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update.' });
    }

    values.push(id);
    const result = await query(
      `UPDATE review_queue SET ${updates.join(', ')} WHERE id = $${idx} AND session_id = $${idx + 1} RETURNING *`,
      [...values, sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Review item not found.' });
    }

    const q = result.rows[0];
    return res.json({
      success: true,
      message: `Review item updated.`,
      item: {
        id: q.id,
        rowNumber: q.row_number,
        field: q.field_name,
        currentValue: q.current_value,
        status: q.status,
        notes: q.notes,
        manualValue: q.manual_value,
        reviewedAt: q.reviewed_at
      }
    });
  } catch (err) {
    console.error('Review update error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

