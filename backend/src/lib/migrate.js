const fs = require('fs');
const path = require('path');
const { getPool } = require('./db');

const MIGRATION_FILE = path.join(__dirname, '../../db/migrations/001_init_sessions.sql');

async function runMigrations() {
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  await getPool().query(sql);
}

module.exports = { runMigrations };
