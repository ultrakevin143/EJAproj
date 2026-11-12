/**
 * Authentication Routes for Role-Based Access Control
 * Inspired by Folio Enterprise Auth System
 */

const express = require('express');
const router = express.Router();

const DEMO_ACCOUNTS = {
  'frontdesk@fitquality.local': {
    id: 'usr_frontdesk_01',
    email: 'frontdesk@fitquality.local',
    name: 'Front-Desk Receptionist',
    role: 'FRONTDESK',
    title: 'Intake & Badge Verification',
    description: 'Enrolls new members and checks keycard safety clearance.'
  },
  'clinic@fitquality.local': {
    id: 'usr_clinic_01',
    email: 'clinic@fitquality.local',
    name: 'Dr. Sarah Miller, PT',
    role: 'CLINIC',
    title: 'Clinical Health Assessor',
    description: 'Records PAR-Q questionnaires, heart rates, and cardiac flags.'
  },
  'turnstile@fitquality.local': {
    id: 'usr_turnstile_01',
    email: 'turnstile@fitquality.local',
    name: 'Turnstile Terminal #1',
    role: 'TURNSTILE',
    title: 'IoT Gate Controller',
    description: 'Machine account querying integrated warehouse for physical access.'
  },
  'steward@fitquality.local': {
    id: 'usr_steward_01',
    email: 'steward@fitquality.local',
    name: 'Elena Rostova',
    role: 'STEWARD',
    title: 'Lead Data Steward',
    description: 'Executes multi-source ETL pipelines and manages DQM review queues.'
  },
  'manager@fitquality.local': {
    id: 'usr_manager_01',
    email: 'manager@fitquality.local',
    name: 'Marcus Vance, GM',
    role: 'MANAGER',
    title: 'General Manager',
    description: 'Strategic BI 360 overview, risk KPIs, and operations monitoring.'
  },
  'admin@fitquality.local': {
    id: 'usr_admin_01',
    email: 'admin@fitquality.local',
    name: 'System Administrator',
    role: 'MANAGER',
    title: 'System Administrator',
    description: 'Full administrative access and configuration.'
  }
};

// In-memory session tracking for active demo user
let currentSessionUser = DEMO_ACCOUNTS['steward@fitquality.local'];

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();

  const account = DEMO_ACCOUNTS[normalizedEmail];
  if (!account) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials. Please select one of the classroom demo accounts.'
    });
  }

  // Accept demo password or allow direct login for demo accounts
  currentSessionUser = account;
  return res.json({
    success: true,
    user: account,
    message: `Signed in successfully as ${account.name} (${account.role})`
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  return res.json({
    success: true,
    user: currentSessionUser || DEMO_ACCOUNTS['steward@fitquality.local']
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
