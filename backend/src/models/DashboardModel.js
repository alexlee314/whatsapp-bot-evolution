const { SESSION_STATES, MIN_PAYMENT_PEN } = require('../config/constants');
const { getAllSessions } = require('./SessionModel');

const DISPLAY_STATES = {
  [SESSION_STATES.NEW]: 'NEW',
  [SESSION_STATES.AWAITING_BIRTH_DATE]: 'WAITING_BIRTHDATE',
  [SESSION_STATES.AWAITING_HOOK_RESPONSE]: 'FREE_READING_DONE',
  [SESSION_STATES.AWAITING_PAYMENT]: 'WAITING_PAYMENT',
  [SESSION_STATES.ACTIVE]: 'SESSION_ACTIVE',
  [SESSION_STATES.SESSION_ENDED]: 'SESSION_ENDED',
  [SESSION_STATES.MINOR_REJECTED]: 'SESSION_ENDED',
};

function maskPhone(userId) {
  const digits = String(userId).replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return `****${digits.slice(-4)}`;
}

function isToday(timestamp) {
  if (!timestamp) return false;
  const d = new Date(timestamp);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatIso(timestamp) {
  return timestamp ? new Date(timestamp).toISOString() : null;
}

function hasPayment(session) {
  return Boolean(session.paymentReceivedAt || session.paymentData);
}

function buildFromSessions(sessions) {
  const todaySessions = sessions.filter((s) => isToday(s.createdAt));
  const activeNow = sessions.filter((s) => s.state === SESSION_STATES.ACTIVE);
  const paidToday = sessions.filter(
    (s) =>
      hasPayment(s) &&
      isToday(s.paymentReceivedAt || s.sessionStartedAt) &&
      (s.state === SESSION_STATES.ACTIVE || s.state === SESSION_STATES.SESSION_ENDED)
  );

  const summary = {
    total_conversations: todaySessions.length,
    active_sessions: activeNow.length,
    payments_today: paidToday.length,
    revenue_today: Number((paidToday.length * MIN_PAYMENT_PEN).toFixed(2)),
  };

  const sessionRows = sessions.filter(
    (s) =>
      hasPayment(s) &&
      s.sessionStartedAt &&
      (s.state === SESSION_STATES.ACTIVE || s.state === SESSION_STATES.SESSION_ENDED)
  );

  const active_sessions = sessionRows.map((s) => ({
    phone: maskPhone(s.userId),
    session_started: formatIso(s.sessionStartedAt),
    time_remaining_minutes:
      s.state === SESSION_STATES.ACTIVE && s.expiresAt
        ? Math.max(0, Math.round((s.expiresAt - Date.now()) / 60000))
        : 0,
    status: s.state === SESSION_STATES.ACTIVE ? 'active' : 'ended',
  }));

  const conversations = sessions
    .slice()
    .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0))
    .map((s) => ({
      phone: maskPhone(s.userId),
      first_contact: formatIso(s.createdAt),
      state: DISPLAY_STATES[s.state] || s.state,
      messages_exchanged: s.messageCount || s.messages?.length || 0,
      payment_received: hasPayment(s),
      last_message: formatIso(s.lastMessageAt),
    }));

  const payments = sessions
    .filter((s) => hasPayment(s))
    .slice()
    .sort((a, b) => (b.paymentReceivedAt || 0) - (a.paymentReceivedAt || 0))
    .map((s) => ({
      phone: maskPhone(s.userId),
      payment_received_at: formatIso(s.paymentReceivedAt),
      session_started: formatIso(s.sessionStartedAt),
      session_ended:
        s.state === SESSION_STATES.ACTIVE ? 'Active' : formatIso(s.sessionEndedAt),
    }));

  return { summary, active_sessions, conversations, payments };
}

async function getDashboardData() {
  const sessions = await getAllSessions();
  return buildFromSessions(sessions);
}

module.exports = { getDashboardData, maskPhone, buildFromSessions };
