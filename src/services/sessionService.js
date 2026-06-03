// Simple in-memory store for MVP
// Replace with a real DB (Supabase/MongoDB) in production
const sessions = new Map();

async function getSession(userId) {
  return sessions.get(userId) || null;
}

async function createSession(userId, state) {
  const session = {
    userId,
    state,
    createdAt: Date.now(),
    expiresAt: null,
    paymentData: null,
    messages: [],
  };
  sessions.set(userId, session);
  return session;
}

async function updateSession(userId, updates) {
  const session = sessions.get(userId);
  if (!session) return null;
  const updated = { ...session, ...updates };
  sessions.set(userId, updated);
  return updated;
}

async function endSession(userId) {
  const session = sessions.get(userId);
  if (session) {
    sessions.set(userId, { ...session, state: 'NEW' });
  }
}

async function getAllSessions() {
  return Array.from(sessions.values());
}

module.exports = { getSession, createSession, updateSession, endSession, getAllSessions };
