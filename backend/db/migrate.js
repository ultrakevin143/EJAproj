/**
 * Database Migration Script
 * Runs schema.sql against the configured PostgreSQL database (local or Neon).
 * Usage: node db/migrate.js
 */

const fs = require('fs');
const path = require('path');
const { query, testConnection, closeDatabase } = require('./neon');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.local'), override: true });

async function migrate() {
  console.log('🔄 Starting database migration...');

  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot connect to database. Check DATABASE_URL in backend/.env.local.');
    process.exitCode = 1;
    return;
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  try {
    await query(sql);
    console.log('✅ Schema migration completed successfully!');
    console.log('   Schema tables and governance rules are ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

migrate();

