/**
 * Governance Rules Route
 * GET  /api/governance              — list all governance rules
 * POST /api/governance              — create a new governance rule
 * PUT  /api/governance/:id/toggle   — toggle is_active flag
 * DELETE /api/governance/:id        — delete a rule
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db/neon');

// GET /api/governance
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM governance_rules ORDER BY enforcement_level DESC, dqm_principle ASC, rule_name ASC`
    );
    return res.json({ success: true, rules: result.rows });
  } catch (err) {
    console.error('Governance fetch error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/governance
router.post('/', async (req, res) => {
  try {
    const { rule_name, rule_description, dqm_principle, enforcement_level } = req.body;
    if (!rule_name || !dqm_principle) {
      return res.status(400).json({ success: false, error: 'rule_name and dqm_principle are required.' });
    }

    const result = await query(
      `INSERT INTO governance_rules (rule_name, rule_description, dqm_principle, enforcement_level)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [rule_name, rule_description || '', dqm_principle, enforcement_level || 'Advisory']
    );
    return res.status(201).json({ success: true, rule: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'A rule with this name already exists.' });
    }
    console.error('Governance create error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/governance/:id/toggle
router.put('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE governance_rules SET is_active = NOT is_active WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Rule not found.' });
    }
    return res.json({ success: true, rule: result.rows[0] });
  } catch (err) {
    console.error('Governance toggle error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/governance/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `DELETE FROM governance_rules WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Rule not found.' });
    }
    return res.json({ success: true, message: 'Governance rule deleted.' });
  } catch (err) {
    console.error('Governance delete error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

