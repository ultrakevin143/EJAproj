/**
 * Neon Cloud & PostgreSQL Connectivity Diagnostic Script
 * Usage: node db/check-neon.js
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

console.log('═══════════════════════════════════════════════════════════');
console.log('  🔍 PostgreSQL & Neon Cloud Connectivity Diagnostic Tool');
console.log('═══════════════════════════════════════════════════════════\n');

if (!connectionString) {
  console.log('⚠️  DATABASE_URL is not set in backend/.env');
  console.log('   The system is currently operating in embedded PostgreSQL emulator mode.');
  console.log('\nTo connect to Neon Cloud:');
  console.log('1. Go to https://neon.tech and create a free project.');
  console.log('2. Copy the connection string and paste into backend/.env:');
  console.log('   DATABASE_URL=postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require');
  console.log('3. Re-run: npm run check-neon\n');
  process.exit(0);
}

const isNeon = connectionString.includes('neon.tech');
console.log(`📡 Target Database: ${isNeon ? 'Neon Cloud Serverless PostgreSQL' : 'PostgreSQL Host'}`);
console.log(`🔗 Connection String: ${connectionString.replace(/:[^:@]+@/, ':****@')}\n`);

const pool = new Pool({
  connectionString,
  ssl: isNeon ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000
});

async function check() {
  try {
    console.log('⏳ Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connection established successfully!\n');

    const versionRes = await client.query('SELECT version()');
    console.log(`📋 Engine Version:\n   ${versionRes.rows[0].version}\n`);

    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tableNames = tablesRes.rows.map(r => r.table_name);
    console.log(`📊 Existing Tables (${tableNames.length}):`);
    if (tableNames.length === 0) {
      console.log('   (No tables found. Run "npm run migrate" to initialize schema.)');
    } else {
      tableNames.forEach(t => console.log(`   • ${t}`));
    }

    client.release();
    console.log('\n🎉 Database is 100% ready for the FitQuality DQM application!');
  } catch (err) {
    console.error('\n❌ Connection error:', err.message);
    console.log('\nTroubleshooting tips:');
    console.log('• Verify username and password in DATABASE_URL.');
    console.log('• For Neon Cloud, make sure "?sslmode=require" is at the end of the URL.');
    console.log('• Ensure your network allows outbound connections on port 5432.');
  } finally {
    await pool.end();
  }
}

check();

