const fs = require('fs');
const path = require('path');

let cache = null;

function getStorePath() {
  if (process.env.DATABASE_PATH) {
    return path.resolve(process.env.DATABASE_PATH);
  }
  return path.join(__dirname, '../../data/sessions.json');
}

function ensureLoaded() {
  if (cache) return cache;

  const storePath = getStorePath();
  fs.mkdirSync(path.dirname(storePath), { recursive: true });

  if (!fs.existsSync(storePath)) {
    cache = {};
    persist();
    return cache;
  }

  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    cache = raw.trim() ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to read sessions store, starting fresh:', err.message);
    cache = {};
  }

  return cache;
}

function persist() {
  const storePath = getStorePath();
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(cache, null, 2), 'utf8');
}

function getSessionRecord(userId) {
  const store = ensureLoaded();
  return store[userId] || null;
}

function saveSessionRecord(session) {
  const store = ensureLoaded();
  store[session.userId] = session;
  persist();
}

function getAllSessionRecords() {
  const store = ensureLoaded();
  return Object.values(store);
}

module.exports = {
  getStorePath,
  getSessionRecord,
  saveSessionRecord,
  getAllSessionRecords,
};
