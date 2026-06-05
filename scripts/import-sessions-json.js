/**
 * One-time import: backend/data/sessions.json → PostgreSQL
 * Usage: npm run db:import
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { connectDb, disconnectDb } = require('../backend/src/lib/db');
const { runMigrations } = require('../backend/src/lib/migrate');
const { saveSessionRecord } = require('../backend/src/lib/sessionStore');
const { canonicalUserId } = require('../backend/src/lib/sessionLifecycle');
const { FUNNEL_VERSION } = require('../backend/src/config/constants');

const JSON_PATH =
  process.env.IMPORT_SESSIONS_PATH ||
  path.join(__dirname, '..', 'backend', 'data', 'sessions.json');

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for import');
  }

  if (!fs.existsSync(JSON_PATH)) {
    console.log('No sessions.json found at', JSON_PATH);
    return;
  }

  await connectDb();
  await runMigrations();

  const raw = fs.readFileSync(JSON_PATH, 'utf8');
  const data = raw.trim() ? JSON.parse(raw) : {};
  const merged = new Map();

  for (const session of Object.values(data)) {
    const userId = canonicalUserId(session.userId);
    const existing = merged.get(userId);
    const candidate = {
      ...session,
      userId,
      funnelVersion: session.funnelVersion ?? FUNNEL_VERSION,
    };

    if (!existing || (candidate.lastMessageAt || 0) >= (existing.lastMessageAt || 0)) {
      merged.set(userId, candidate);
    }
  }

  for (const session of merged.values()) {
    await saveSessionRecord(session);
    console.log('Imported', session.userId, '→', session.state);
  }

  console.log(`\nDone. Imported ${merged.size} session(s) into PostgreSQL.`);
  await disconnectDb();
}

main().catch(async (err) => {
  console.error('Import failed:', err.message);
  await disconnectDb();
  process.exit(1);
});
