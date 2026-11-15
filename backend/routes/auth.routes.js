/**
 * Authentication Routes for Role-Based Access Control
 * Authentic Filipino gym operations team accounts
 */

const express = require('express');
const router = express.Router();
const { verifyPassword } = require('../lib/passwords');
const { appendAuditEvent } = require('../lib/auditLog');
const {
  clearSession,
  createRateLimiter,
  createSession,
  getSessionUser,
  setSessionCookie
} = require('../middleware/auth');

const DEMO_ACCOUNTS = {
  'intake@fitquality.local': {
    id: 'usr_frontdesk_02',
    email: 'intake@fitquality.local',
    name: 'Front Desk Staff',
    role: 'FRONTDESK',
    title: 'Front-Desk Intake Officer',
    description: 'Enrolls new members and checks keycard safety clearance.'
  },
  'health@fitquality.local': {
    id: 'usr_clinic_02',
    email: 'health@fitquality.local',
    name: 'Clinic Assessor',
    role: 'CLINIC',
    title: 'Lead Clinical Fitness Assessor',
    description: 'Records PAR-Q questionnaires, resting heart rates, and cardiac flags.'
  },
  'gate@fitquality.local': {
    id: 'usr_turnstile_02',
    email: 'gate@fitquality.local',
    name: 'Gym Gate One',
    role: 'TURNSTILE',
    title: 'Facility IoT RFID Terminal',
    description: 'Machine account querying integrated warehouse for physical access.'
  },
  'quality@fitquality.local': {
    id: 'usr_steward_02',
    email: 'quality@fitquality.local',
    name: 'Data Steward',
    role: 'STEWARD',
    title: 'Lead Data Quality Steward',
    description: 'Executes multi-source ETL pipelines and manages DQM review queues.'
  },
  'operations@fitquality.local': {
    id: 'usr_manager_02',
    email: 'operations@fitquality.local',
    name: 'Operations Manager',
    role: 'MANAGER',
    title: 'General Manager & Head of Operations',
    description: 'Limited operations summary and service monitoring.'
  },
  'owner@fitquality.local': {
    id: 'usr_admin_02',
    email: 'owner@fitquality.local',
    name: 'System Administrator',
    role: 'ADMIN',
    title: 'System Administrator & General Manager',
    description: 'Highest administrative authority over club operations, security, and warehouse analytics.'
  }
};

const passwordRecords = new Map();
for (const account of Object.values(DEMO_ACCOUNTS)) {
  const envKey = `FITQUALITY_PASSWORD_HASH_${account.id.toUpperCase()}`;
  passwordRecords.set(account.id, process.env[envKey] || null);
}

const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many sign-in attempts. Please wait and try again.'
});

function publicAccount(account) {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role,
    title: account.title
  };
}

// POST /api/auth/login
router.post('/login', loginRateLimit, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const account = DEMO_ACCOUNTS[email];
  const passwordRecord = account ? passwordRecords.get(account.id) : null;

  if (!account || !passwordRecord || password.length > 1024) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  let passwordMatches = false;
  try {
    passwordMatches = await verifyPassword(password, passwordRecord);
  } catch (error) {
    console.error('Password verification failed:', error);
    return res.status(500).json({ success: false, error: 'Sign-in is temporarily unavailable.' });
  }

  if (!passwordMatches) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  const user = publicAccount(account);
  try {
    await appendAuditEvent(user, 'sign_in', 'account', user.id);
  } catch (error) {
    console.error('Sign-in audit could not be recorded:', error.message);
    return res.status(503).json({ success: false, error: 'Sign-in is temporarily unavailable. Please try again.' });
  }
  const session = createSession(user);
  setSessionCookie(res, session.token);
  return res.json({
    success: true,
    user,
    message: `Signed in successfully as ${account.name}.`
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      user: null
    });
  }
  return res.json({
    success: true,
    user
  });
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const user = getSessionUser(req);
  if (user) {
    try {
      await appendAuditEvent(user, 'sign_out', 'account', user.id);
    } catch (error) {
      console.error('Sign-out audit could not be recorded:', error.message);
      return res.status(503).json({ success: false, error: 'Sign-out could not be recorded. Please try again.' });
    }
  }
  clearSession(req, res);
  res.setHeader('Cache-Control', 'no-store');
  return res.json({
    success: true,
    message: 'Signed out successfully'
  });
});

module.exports = router;
