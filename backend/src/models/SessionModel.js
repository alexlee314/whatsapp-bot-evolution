const { SESSION_STATES, FUNNEL_VERSION } = require('../config/constants');
const {
  getSessionRecord,
  saveSessionRecord,
  getAllSessionRecords,
  findExpiredActiveSessions,
  getStoreLabel,
  resolveStoreKind,
} = require('../lib/sessionStore');
const {
  canonicalUserId,
  applySessionLifecycle,
  clearedFunnelFields,
} = require('../lib/sessionLifecycle');
const { invalidateCachedSession } = require('../lib/sessionCache');

const sessionTimers = new Map();

async function loadSession(userId) {
  const canonical = canonicalUserId(userId);
  const store = { getSessionRecord, saveSessionRecord };

  let session = await getSessionRecord(canonical);

  if (!session && canonical !== userId) {
    const legacy = await getSessionRecord(userId);
    if (legacy) {
      session = { ...legacy, userId: canonical };
      await saveSessionRecord(session);
    }
  }

  if (!session) return null;

  const lifecycle = applySessionLifecycle(session);
  const resetReason = lifecycle._lifecycleReset;
  if (resetReason) {
    const { _lifecycleReset, ...clean } = lifecycle;
    await saveSessionRecord(clean);
    console.log(`Session lifecycle reset (${resetReason}): ${canonical}`);
    return clean;
  }

  if (lifecycle.userId !== session.userId) {
    await saveSessionRecord(lifecycle);
  }

  return lifecycle;
}

async function persistSession(session) {
  await saveSessionRecord(session);
  return session;
}

async function getSession(userId) {
  return loadSession(userId);
}

async function createSession(userId, state, extra = {}) {
  const canonical = canonicalUserId(userId);
  const now = Date.now();
  const session = {
    userId: canonical,
    state,
    funnelVersion: FUNNEL_VERSION,
    createdAt: now,
    lastMessageAt: now,
    expiresAt: null,
    paymentData: null,
    paymentReceivedAt: null,
    sessionStartedAt: null,
    sessionEndedAt: null,
    birthDate: null,
    birthTime: null,
    location: null,
    ageVerified: false,
    numerology: null,
    funnelMessages: [],
    messages: [],
    messageCount: 0,
    ...extra,
  };

  await saveSessionRecord(session);
  return session;
}

async function updateSession(userId, updates) {
  const session = await loadSession(userId);
  if (!session) return null;

  const updated = { ...session, ...updates, userId: session.userId };
  await saveSessionRecord(updated);
  return updated;
}

async function touchSession(userId, extra = {}) {
  const session = await loadSession(userId);
  if (!session) return null;

  return updateSession(userId, {
    lastMessageAt: Date.now(),
    messageCount: (session.messageCount || 0) + 1,
    ...extra,
  });
}

async function resetSessionForRestart(userId) {
  const canonical = canonicalUserId(userId);
  invalidateCachedSession(canonical);

  if (sessionTimers.has(canonical)) {
    clearTimeout(sessionTimers.get(canonical));
    sessionTimers.delete(canonical);
  }

  const now = Date.now();
  const session = {
    userId: canonical,
    state: SESSION_STATES.AWAITING_BIRTH_DATE,
    funnelVersion: FUNNEL_VERSION,
    createdAt: now,
    lastMessageAt: now,
    expiresAt: null,
    paymentData: null,
    paymentReceivedAt: null,
    sessionStartedAt: null,
    sessionEndedAt: null,
    ...clearedFunnelFields(),
  };

  await saveSessionRecord(session);
  return session;
}

async function endSession(userId) {
  if (sessionTimers.has(userId)) {
    clearTimeout(sessionTimers.get(userId));
    sessionTimers.delete(userId);
  }

  const canonical = canonicalUserId(userId);
  const session = await getSessionRecord(canonical);
  if (!session) return;

  await saveSessionRecord({
    ...session,
    state: SESSION_STATES.SESSION_ENDED,
    expiresAt: null,
    sessionEndedAt: Date.now(),
    messages: session.messages || [],
    // Keep paymentReceivedAt / paymentData so we never re-show the free payment wall
  });
}

function scheduleSessionEnd(userId, delayMs, callback) {
  const canonical = canonicalUserId(userId);
  if (sessionTimers.has(canonical)) {
    clearTimeout(sessionTimers.get(canonical));
  }

  const timer = setTimeout(callback, delayMs);
  sessionTimers.set(canonical, timer);
}

async function getAllSessions() {
  return getAllSessionRecords();
}

async function restoreActiveSessionTimers(onExpire) {
  const sessions = await getAllSessionRecords();
  const now = Date.now();

  for (const session of sessions) {
    const refreshed = applySessionLifecycle(session, now);
    if (refreshed._lifecycleReset) {
      const { _lifecycleReset, ...clean } = refreshed;
      await saveSessionRecord(clean);
      continue;
    }

    if (session.state !== SESSION_STATES.ACTIVE || !session.expiresAt) {
      continue;
    }

    const remaining = session.expiresAt - now;

    if (remaining <= 0) {
      await endSession(session.userId);
      if (onExpire) await onExpire(session.userId);
      continue;
    }

    scheduleSessionEnd(session.userId, remaining, () => onExpire(session.userId));
  }
}

async function pollExpiredActiveSessions(onExpire) {
  const now = Date.now();
  const expired = await findExpiredActiveSessions(SESSION_STATES.ACTIVE, now);

  for (const session of expired) {
    await endSession(session.userId);
    if (onExpire) await onExpire(session.userId);
  }
}

function startSessionExpiryWorker(onExpire, intervalMs) {
  const { SESSION_EXPIRY_POLL_MS } = require('../config/constants');
  const ms = intervalMs || SESSION_EXPIRY_POLL_MS;

  pollExpiredActiveSessions(onExpire).catch((err) => {
    console.error('Session expiry poll error:', err.message);
  });

  return setInterval(() => {
    pollExpiredActiveSessions(onExpire).catch((err) => {
      console.error('Session expiry poll error:', err.message);
    });
  }, ms);
}

module.exports = {
  getSession,
  createSession,
  updateSession,
  persistSession,
  touchSession,
  endSession,
  resetSessionForRestart,
  scheduleSessionEnd,
  getAllSessions,
  restoreActiveSessionTimers,
  pollExpiredActiveSessions,
  startSessionExpiryWorker,
  getStorePath: getStoreLabel,
  resolveStoreKind,
};
