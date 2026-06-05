require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { connectDb, disconnectDb } = require('../backend/src/lib/db');
const { runMigrations } = require('../backend/src/lib/migrate');
const { resolveStoreKind } = require('../backend/src/lib/sessionStore');

async function main() {
  const storeKind = resolveStoreKind();
  if (storeKind !== 'postgres') {
    console.log(`SESSION_STORE=${process.env.SESSION_STORE || 'auto'} (not postgres). Skipping DB check.`);
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required when using PostgreSQL session store');
  }

  await connectDb();
  console.log('PostgreSQL connection OK');

  await runMigrations();
  console.log('Migrations up to date');

  const { getPool } = require('../backend/src/lib/db');
  const { rows } = await getPool().query(
    "SELECT to_regclass('public.sessions') AS sessions_table"
  );
  if (!rows[0]?.sessions_table) {
    throw new Error('sessions table missing after migration');
  }
  console.log('sessions table OK');

  await disconnectDb();
}

main().catch(async (err) => {
  console.error('Database check failed:', err.message || err);
  await disconnectDb();
  process.exit(1);
});
