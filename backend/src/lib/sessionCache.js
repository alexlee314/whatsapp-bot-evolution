const CACHE_TTL_MS = 45_000;
const cache = new Map();

function getCachedSession(userId) {
  const entry = cache.get(userId);
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(userId);
    return null;
  }
  return entry.session;
}

function setCachedSession(session) {
  if (!session?.userId) return;
  cache.set(session.userId, {
    session,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function invalidateCachedSession(userId) {
  cache.delete(userId);
}

module.exports = {
  getCachedSession,
  setCachedSession,
  invalidateCachedSession,
};
