/**
 * Database Migration Script
 * Runs schema.sql against the configured PostgreSQL database (local or Neon).
 * Usage: node db/migrate.js
 */

const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('./neon');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  console.log('🔄 Starting database migration...');

  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot connect to database. Check your DATABASE_URL in .env');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  try {
    await pool.query(sql);
    console.log('✅ Schema migration completed successfully!');
    console.log('   Tables created: audit_sessions, audit_records, audit_errors, review_queue, governance_rules, cleaned_records');
    console.log('   Governance rules seeded.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

