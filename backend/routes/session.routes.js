/**
 * Sessions Route
 * GET /api/sessions         — list all past audit sessions (audit history)
 * DELETE /api/sessions/:id  — archive/delete a session
 */

const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db/neon');
const { requireAuth, requireRole } = require('../middleware/auth');
const { appendAuditEvent } = require('../lib/auditLog');

router.use(requireAuth, requireRole('STEWARD', 'ADMIN'));

// GET /api/sessions
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, file_name, uploaded_at, total_records, total_issue_events,
              unique_affected_records, affected_percent, status
       FROM audit_sessions
       ORDER BY uploaded_at DESC
       LIMIT 50`
    );
    await appendAuditEvent(req.authUser, 'read', 'audit_sessions', '', 'Audit session list accessed.');
    return res.json({ success: true, sessions: result.rows });
  } catch (err) {
    console.error('Sessions fetch error:', err);
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

// DELETE /api/sessions/:id
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    // CASCADE will remove related records, errors, review queue, cleaned_records
    const result = await withTransaction(async (tx) => {
      const deleted = await tx(`DELETE FROM audit_sessions WHERE id = $1 RETURNING id`, [id]);
      if (deleted.rows[0]) {
        await appendAuditEvent(req.authUser, 'delete', 'audit_session', id, 'Audit session and related data deleted.', tx);
      }
      return deleted;
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }
    return res.json({ success: true, message: 'Session and all related data deleted.' });
  } catch (err) {
    console.error('Session delete error:', err);
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

module.exports = router;

