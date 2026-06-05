const fs = require('fs');
const path = require('path');
const { getPool } = require('./db');

const MIGRATIONS_DIR = path.join(__dirname, '../../db/migrations');

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function isMigrationApplied(client, version) {
  const { rows } = await client.query(
    'SELECT 1 FROM schema_migrations WHERE version = $1',
    [version]
  );
  return rows.length > 0;
}

async function runMigrations() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No migration files found in ${MIGRATIONS_DIR}`);
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await ensureMigrationTable(client);

    for (const file of files) {
      const version = path.basename(file, '.sql');
      if (await isMigrationApplied(client, version)) {
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
        await client.query('COMMIT');
        console.log(`Applied migration: ${version}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };
