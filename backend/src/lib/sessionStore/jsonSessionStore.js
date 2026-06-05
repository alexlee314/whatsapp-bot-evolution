const fs = require('fs');
const path = require('path');

let cache = null;
let lastLoadedMtime = null;

function getStorePath() {
  if (process.env.DATABASE_PATH) {
    return path.resolve(process.env.DATABASE_PATH);
  }
  return path.join(__dirname, '../../../data/sessions.json');
}

function loadFromDisk() {
  const storePath = getStorePath();
  fs.mkdirSync(path.dirname(storePath), { recursive: true });

  if (!fs.existsSync(storePath)) {
    cache = {};
    lastLoadedMtime = null;
    persist();
    return cache;
  }

  try {
    const stat = fs.statSync(storePath);
    lastLoadedMtime = stat.mtimeMs;
    const raw = fs.readFileSync(storePath, 'utf8');
    cache = raw.trim() ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to read sessions store, starting fresh:', err.message);
    cache = {};
    lastLoadedMtime = null;
  }

  return cache;
}

function ensureLoaded() {
  const storePath = getStorePath();

  if (!fs.existsSync(storePath)) {
    if (cache !== null) return cache;
    return loadFromDisk();
  }

  const mtime = fs.statSync(storePath).mtimeMs;
  if (cache === null || lastLoadedMtime !== mtime) {
    return loadFromDisk();
  }

  return cache;
}

function persist() {
  const storePath = getStorePath();
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(cache, null, 2), 'utf8');
  lastLoadedMtime = fs.statSync(storePath).mtimeMs;
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

function findExpiredActiveSessions(state, nowMs) {
  return getAllSessionRecords().filter(
    (session) => session.state === state && session.expiresAt && session.expiresAt <= nowMs
  );
}

function getStoreLabel() {
  return getStorePath();
}

module.exports = {
  getSessionRecord,
  saveSessionRecord,
  getAllSessionRecords,
  findExpiredActiveSessions,
  getStoreLabel,
  getStorePath,
};
