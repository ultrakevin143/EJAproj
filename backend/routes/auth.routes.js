/**
 * Authentication Routes for Role-Based Access Control
 * Authentic Filipino gym operations team accounts
 */

const express = require('express');
const router = express.Router();

const DEMO_ACCOUNTS = {
  'frontdesk@fitquality.local': {
    id: 'usr_frontdesk_01',
    email: 'frontdesk@fitquality.local',
    name: 'Marites Dela Cruz',
    role: 'FRONTDESK',
    title: 'Front-Desk Intake Officer',
    description: 'Enrolls new members and checks keycard safety clearance.'
  },
  'clinic@fitquality.local': {
    id: 'usr_clinic_01',
    email: 'clinic@fitquality.local',
    name: 'Dr. Maria Elena Reyes, MD',
    role: 'CLINIC',
    title: 'Lead Clinical Fitness Assessor',
    description: 'Records PAR-Q questionnaires, resting heart rates, and cardiac flags.'
  },
  'turnstile@fitquality.local': {
    id: 'usr_turnstile_01',
    email: 'turnstile@fitquality.local',
    name: 'Turnstile Gate 01 (BGC Branch)',
    role: 'TURNSTILE',
    title: 'Facility IoT RFID Terminal',
    description: 'Machine account querying integrated warehouse for physical access.'
  },
  'steward@fitquality.local': {
    id: 'usr_steward_01',
    email: 'steward@fitquality.local',
    name: 'Danilo Fernandez',
    role: 'STEWARD',
    title: 'Lead Data Quality Steward',
    description: 'Executes multi-source ETL pipelines and manages DQM review queues.'
  },
  'manager@fitquality.local': {
    id: 'usr_manager_01',
    email: 'manager@fitquality.local',
    name: 'Engr. Ricardo Mendoza, GM',
    role: 'MANAGER',
    title: 'General Manager & Head of Operations',
    description: 'Strategic BI 360 overview, risk KPIs, and operations monitoring.'
  },
  'admin@fitquality.local': {
    id: 'usr_admin_01',
    email: 'admin@fitquality.local',
    name: 'Engr. Ricardo Mendoza (Administrator)',
    role: 'MANAGER',
    title: 'System Administrator & General Manager',
    description: 'Highest administrative authority over club operations, security, and warehouse analytics.'
  }
};

// In-memory session tracking for active demo user (defaults to null for login)
let currentSessionUser = null;

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();

  const account = DEMO_ACCOUNTS[normalizedEmail];
  if (!account) {
    return res.status(401).json({
      success: false,
      error: 'Invalid account email. Please choose one of the designated role accounts.'
    });
  }

  currentSessionUser = account;
  return res.json({
    success: true,
    user: account,
    message: `Signed in successfully as ${account.name} (${account.role})`
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!currentSessionUser) {
    return res.status(401).json({
      success: false,
      user: null
    });
  }
  return res.json({
    success: true,
    user: currentSessionUser
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  currentSessionUser = null;
  return res.json({
    success: true,
    message: 'Signed out successfully'
  });
});

// GET /api/auth/accounts
router.get('/accounts', (req, res) => {
  return res.json({
    success: true,
    accounts: Object.values(DEMO_ACCOUNTS)
  });
});

module.exports = router;
