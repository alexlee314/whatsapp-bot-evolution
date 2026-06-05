const { getStore, isPostgresStore, resolveStoreKind } = require('./sessionStore/index');

async function getSessionRecord(userId) {
  return getStore().getSessionRecord(userId);
}

async function saveSessionRecord(session) {
  return getStore().saveSessionRecord(session);
}

async function getAllSessionRecords() {
  return getStore().getAllSessionRecords();
}

async function findExpiredActiveSessions(state, nowMs) {
  return getStore().findExpiredActiveSessions(state, nowMs);
}

function getStoreLabel() {
  return getStore().getStoreLabel();
}

function getStorePath() {
  const store = getStore();
  if (typeof store.getStorePath === 'function') {
    return store.getStorePath();
  }
  return getStoreLabel();
}

module.exports = {
  getSessionRecord,
  saveSessionRecord,
  getAllSessionRecords,
  findExpiredActiveSessions,
  getStoreLabel,
  getStorePath,
  isPostgresStore,
  resolveStoreKind,
};
