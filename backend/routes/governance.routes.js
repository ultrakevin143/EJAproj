/**
 * Governance Rules Route
 * GET  /api/governance              — list all governance rules
 * POST /api/governance              — create a new governance rule
 * PUT  /api/governance/:id/toggle   — toggle is_active flag
 * DELETE /api/governance/:id        — delete a rule
 */

const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db/neon');
const { requireAuth, requireRole } = require('../middleware/auth');
const { appendAuditEvent } = require('../lib/auditLog');
const { DATA_CATALOG } = require('../lib/dataCatalog');

router.use(requireAuth, requireRole('STEWARD', 'ADMIN'));

router.get('/catalog', async (req, res) => {
  await appendAuditEvent(req.authUser, 'read', 'data_catalog', '', 'Data catalog viewed.');
  return res.json({ success: true, fields: DATA_CATALOG });
});

// GET /api/governance
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM governance_rules ORDER BY enforcement_level DESC, dqm_principle ASC, rule_name ASC`
    );
    await appendAuditEvent(req.authUser, 'read', 'governance_rules', '', 'Governance policies viewed.');
    return res.json({ success: true, rules: result.rows });
  } catch (err) {
    console.error('Governance fetch error:', err);
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

// POST /api/governance
router.post('/', async (req, res) => {
  try {
    const { rule_name, rule_description, dqm_principle, enforcement_level } = req.body;
    const normalizedName = typeof rule_name === 'string' ? rule_name.trim() : '';
    const normalizedDescription = typeof rule_description === 'string' ? rule_description.trim() : '';
    const validPrinciples = ['Accuracy', 'Consistency', 'Completeness', 'Timeliness', 'Reliability', 'Relevance'];
    const normalizedLevel = enforcement_level || 'Advisory';
    if (!normalizedName || normalizedName.length > 120 || normalizedDescription.length > 500) {
      return res.status(400).json({ success: false, error: 'Rule name is required; names may be 120 characters and descriptions 500 characters.' });
    }
    if (!validPrinciples.includes(dqm_principle) || normalizedLevel !== 'Advisory') {
      return res.status(400).json({ success: false, error: 'Custom policies must use a supported DQM principle and remain advisory.' });
    }

    const result = await withTransaction(async (tx) => {
      const inserted = await tx(
        `INSERT INTO governance_rules (rule_name, rule_description, dqm_principle, enforcement_level)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [normalizedName, normalizedDescription, dqm_principle, normalizedLevel]
      );
      await appendAuditEvent(req.authUser, 'create', 'governance_rule', inserted.rows[0].id, `Created ${dqm_principle} rule.`, tx);
      return inserted;
    });
    return res.status(201).json({ success: true, rule: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'A rule with this name already exists.' });
    }
    console.error('Governance create error:', err);
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

// PUT /api/governance/:id/toggle
router.put('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT enforcement_level FROM governance_rules WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Rule not found.' });
    }
    if (existing.rows[0].enforcement_level === 'Mandatory') {
      return res.status(403).json({ success: false, error: 'Mandatory backend checks cannot be disabled here.' });
    }
    const result = await withTransaction(async (tx) => {
      const updated = await tx(
        `UPDATE governance_rules SET is_active = NOT is_active WHERE id = $1 AND enforcement_level = 'Advisory' RETURNING *`,
        [id]
      );
      if (updated.rows[0]) {
        await appendAuditEvent(req.authUser, 'toggle', 'governance_rule', id, `Rule active state is now ${updated.rows[0].is_active}.`, tx);
      }
      return updated;
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Rule not found.' });
    }
    return res.json({ success: true, rule: result.rows[0] });
  } catch (err) {
    console.error('Governance toggle error:', err);
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

// DELETE /api/governance/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT enforcement_level FROM governance_rules WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Rule not found.' });
    }
    if (existing.rows[0].enforcement_level === 'Mandatory') {
      return res.status(403).json({ success: false, error: 'Mandatory backend checks cannot be deleted here.' });
    }
    const result = await withTransaction(async (tx) => {
      const deleted = await tx(
        `DELETE FROM governance_rules WHERE id = $1 AND enforcement_level = 'Advisory' RETURNING id`,
        [id]
      );
      if (deleted.rows[0]) {
        await appendAuditEvent(req.authUser, 'delete', 'governance_rule', id, 'Governance rule deleted.', tx);
      }
      return deleted;
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Rule not found.' });
    }
    return res.json({ success: true, message: 'Governance rule deleted.' });
  } catch (err) {
    console.error('Governance delete error:', err);
    return res.status(500).json({ success: false, error: 'The request could not be completed.' });
  }
});

module.exports = router;

