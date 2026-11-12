/**
 * Database Connection & Adapter Layer
 * Supports:
 *  1. Live PostgreSQL / Neon Cloud PostgreSQL (when DATABASE_URL is reachable)
 *  2. Embedded PostgreSQL Emulator (via pg-mem) for instant zero-config local testing
 */

const { Pool } = require('pg');
const { newDb } = require('pg-mem');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/gym_dqm';

let livePool = null;
let memoryDb = null;
let memoryPgClient = null;
let isUsingMemoryDb = false;

const DEFAULT_GOVERNANCE_RULES = [
  ['Mandatory Full Name Validation', 'All gym member records must contain at least First and Last name. Single-token names are rejected at intake.', 'Completeness', 'Mandatory'],
  ['Date of Birth Required Field', 'DOB is a required field. Records missing DOB cannot be screened or activated in the gym system.', 'Completeness', 'Mandatory'],
  ['ISO-8601 Date Format Standard', 'All date fields (DOB, Date Recorded) must be stored in YYYY-MM-DD format. Non-standard formats are auto-standardized on import.', 'Consistency', 'Mandatory'],
  ['Controlled Screening Result Vocabulary', 'Only "Cleared", "Flagged", or "Pending" are accepted screening result values. Abbreviations are automatically expanded.', 'Consistency', 'Mandatory'],
  ['Email Format Validation', 'All member email addresses must pass RFC-compliant syntax validation before being stored.', 'Accuracy', 'Mandatory'],
  ['Data Steward Review After Each Upload', 'Every dataset upload must be reviewed by a designated data steward before records are marked as approved.', 'Reliability', 'Advisory'],
  ['Duplicate Record Detection', 'Exact duplicate member records are automatically flagged and must be resolved before activation.', 'Accuracy', 'Mandatory'],
  ['Audit Trail Preservation', 'All changes to member records (automated or manual) must be logged in the correction changelog. No silent overwrites.', 'Reliability', 'Mandatory']
];

function initMemoryDb() {
  if (memoryDb) return;

  const db = newDb();

  db.registerExtension('pgcrypto', () => {});
  db.public.registerFunction({
    name: 'gen_random_uuid',
    implementation: () => crypto.randomUUID()
  });

  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const rawSql = fs.readFileSync(schemaPath, 'utf-8');
    const tableParts = rawSql.split('-- ─── SEED: Default Governance Rules ──────────────────────────');
    let tableDefs = tableParts[0]
      .replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";/gi, '')
      .replace(/TIMESTAMPTZ/gi, 'TIMESTAMP');

    db.public.none(tableDefs);

    // Seed governance rules
    for (const r of DEFAULT_GOVERNANCE_RULES) {
      db.public.none(
        `INSERT INTO governance_rules (id, rule_name, rule_description, dqm_principle, enforcement_level, is_active)
         VALUES ('${crypto.randomUUID()}', '${r[0]}', '${r[1].replace(/'/g, "''")}', '${r[2]}', '${r[3]}', true)`
      );
    }
  }

  memoryDb = db;
  const pgAdapter = db.adapters.createPg();
  memoryPgClient = new pgAdapter.Pool();
  isUsingMemoryDb = true;
  console.log('💡 [DB Mode]: Running in embedded PostgreSQL emulator (pg-mem). Zero config needed!');
}

/**
 * Run a SQL query
 */
async function query(text, params = []) {
  if (isUsingMemoryDb || !livePool) {
    if (!memoryPgClient) {
      initMemoryDb();
    }
    return await memoryPgClient.query(text, params);
  }

  return await livePool.query(text, params);
}

/**
 * Test database connection on startup
 */
async function testConnection() {
  try {
    const testPool = new Pool({
      connectionString,
      ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 2000
    });

    const res = await testPool.query('SELECT NOW() AS now');
    console.log(`✅ [DB Mode]: Connected to live PostgreSQL server at ${res.rows[0].now}`);
    livePool = testPool;
    isUsingMemoryDb = false;
    return true;
  } catch (err) {
    console.log(`ℹ️  Live PostgreSQL not reachable (${err.message}). Activating embedded PostgreSQL engine...`);
    initMemoryDb();
    return true;
  }
}

module.exports = {
  query,
  testConnection,
  isInMemory: () => isUsingMemoryDb
};
