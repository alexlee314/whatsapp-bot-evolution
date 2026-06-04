const { SESSION_STATES } = require('../config/constants');
const {
  getSessionRecord,
  saveSessionRecord,
  getAllSessionRecords,
  getStorePath,
} = require('../lib/sessionStore');

const sessionTimers = new Map();

async function getSession(userId) {
  return getSessionRecord(userId);
}

async function createSession(userId, state, extra = {}) {
  const now = Date.now();
  const session = {
    userId,
    state,
    createdAt: now,
    lastMessageAt: now,
    expiresAt: null,
    paymentData: null,
    paymentReceivedAt: null,
    sessionStartedAt: null,
    sessionEndedAt: null,
    birthDate: null,
    location: null,
    ageVerified: false,
    numerology: null,
    messages: [],
    messageCount: 0,
    ...extra,
  };

  saveSessionRecord(session);
  return session;
}

async function updateSession(userId, updates) {
  const session = await getSession(userId);
  if (!session) return null;

  const updated = { ...session, ...updates };
  saveSessionRecord(updated);
  return updated;
}

async function touchSession(userId, extra = {}) {
  const session = await getSession(userId);
  if (!session) return null;

  return updateSession(userId, {
    lastMessageAt: Date.now(),
    messageCount: (session.messageCount || 0) + 1,
    ...extra,
  });
}

async function endSession(userId) {
  if (sessionTimers.has(userId)) {
    clearTimeout(sessionTimers.get(userId));
    sessionTimers.delete(userId);
  }

  const session = await getSession(userId);
  if (!session) return;

  saveSessionRecord({
    ...session,
    state: SESSION_STATES.SESSION_ENDED,
    expiresAt: null,
    sessionEndedAt: Date.now(),
    messages: session.messages || [],
  });
}

function scheduleSessionEnd(userId, delayMs, callback) {
  if (sessionTimers.has(userId)) {
    clearTimeout(sessionTimers.get(userId));
  }

  const timer = setTimeout(callback, delayMs);
  sessionTimers.set(userId, timer);
}

async function getAllSessions() {
  return getAllSessionRecords();
}

async function restoreActiveSessionTimers(onExpire) {
  const sessions = await getAllSessions();
  const now = Date.now();

  for (const session of sessions) {
    if (session.state !== SESSION_STATES.ACTIVE || !session.expiresAt) {
      continue;
    }

    const remaining = session.expiresAt - now;

    if (remaining <= 0) {
      await endSession(session.userId);
      continue;
    }

    scheduleSessionEnd(session.userId, remaining, () => onExpire(session.userId));
  }
}

module.exports = {
  getSession,
  createSession,
  updateSession,
  touchSession,
  endSession,
  scheduleSessionEnd,
  getAllSessions,
  restoreActiveSessionTimers,
  getStorePath,
};
