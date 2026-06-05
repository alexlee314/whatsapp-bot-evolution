require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { connectDb, disconnectDb } = require('../backend/src/lib/db');
const { runMigrations } = require('../backend/src/lib/migrate');

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  await connectDb();
  await runMigrations();
  console.log('Database migrations applied.');
  await disconnectDb();
}

main().catch(async (err) => {
  console.error('Migration failed:', err.message || err);
  await disconnectDb();
  process.exit(1);
});
