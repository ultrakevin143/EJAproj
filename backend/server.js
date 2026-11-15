/**
 * Express Server — Gym Member Health Screening DQM System
 * Industry: Fitness & Gym Health Records
 *
 * API Routes:
 *   POST   /api/upload                        — Upload CSV
 *   POST   /api/upload/generate-sample        — Generate 500-record dataset
 *   GET    /api/audit/latest                  — Get most recent audit
 *   GET    /api/audit/:sessionId              — Get audit by session
 *   POST   /api/clean/:sessionId              — Apply safe cleaning
 *   GET    /api/clean/:sessionId/compare      — Before vs after comparison
 *   GET    /api/review/:sessionId             — Get review queue
 *   POST   /api/review/:sessionId/update      — Update review item
 *   GET    /api/governance                    — List governance rules
 *   POST   /api/governance                    — Create governance rule
 *   PUT    /api/governance/:id/toggle         — Toggle rule active state
 *   DELETE /api/governance/:id               — Delete rule
 *   GET    /api/sessions                      — List all past sessions
 *   DELETE /api/sessions/:id                  — Delete a session
 *   GET    /api/export/:sessionId/:type       — Export data
 *   GET    /api/health                        — Health check
 */

const path = require('path');
const forceMemoryModeRequested = process.env.FITQUALITY_FORCE_MEMORY_DB === 'true';
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env.local'), override: true });
if (forceMemoryModeRequested) process.env.FITQUALITY_FORCE_MEMORY_DB = 'true';
const express = require('express');
const cors = require('cors');

const { testConnection } = require('./db/neon');

// Routes
const uploadRoutes     = require('./routes/upload.routes');
const auditRoutes      = require('./routes/audit.routes');
const cleanRoutes      = require('./routes/clean.routes');
const reviewRoutes     = require('./routes/review.routes');
const governanceRoutes = require('./routes/governance.routes');
const sessionRoutes    = require('./routes/session.routes');
const exportRoutes     = require('./routes/export.routes');
const roleRoutes       = require('./routes/role.routes');
const authRoutes       = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const isWriteRequest = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const origin = req.get('origin');
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3001';
  if (isWriteRequest && origin && origin !== allowedOrigin) {
    return res.status(403).json({ success: false, error: 'Request origin is not allowed.' });
  }
  return next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/upload',      uploadRoutes);
app.use('/api/audit',       auditRoutes);
app.use('/api/clean',       cleanRoutes);
app.use('/api/review',      reviewRoutes);
app.use('/api/governance',  governanceRoutes);
app.use('/api/sessions',    sessionRoutes);
app.use('/api/export',      exportRoutes);
app.use('/api/roles',       roleRoutes);
app.use('/api/auth',        authRoutes);

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Gym DQM Backend',
    industry: 'Fitness & Gym Member Health Screening',
    timestamp: new Date().toISOString()
  });
});

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Startup ──────────────────────────────────────────────────
async function start() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  🏋️  Gym Member Health Screening — DQM System');
  console.log('  Industry: Fitness & Gym Health Records');
  console.log('═══════════════════════════════════════════════════');

  const databaseReady = await testConnection();
  if (!databaseReady) {
    console.error('Database connection failed. The server was not started.');
    process.exitCode = 1;
    return;
  }

  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`   Frontend expected at: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
    console.log('═══════════════════════════════════════════════════');
  });
}

start();

module.exports = app;

