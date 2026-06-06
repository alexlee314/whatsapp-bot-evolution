const {
  SESSION_STATES,
  FUNNEL_VERSION,
  STALE_MID_FUNNEL_MS,
  STALE_BIRTH_DATE_MS,
} = require('../config/constants');

function canonicalUserId(userId) {
  const value = String(userId || '').trim();
  if (!value) return value;

  if (value.startsWith('whatsapp:')) {
    const number = value.slice('whatsapp:'.length);
    return number.startsWith('+') ? `whatsapp:${number}` : `whatsapp:+${number}`;
  }

  return value.startsWith('+') ? `whatsapp:${value}` : `whatsapp:+${value}`;
}

function clearedFunnelFields() {
  return {
    birthDate: null,
    birthTime: null,
    location: null,
    ageVerified: false,
    numerology: null,
    paymentData: null,
    paymentReceivedAt: null,
    sessionStartedAt: null,
    sessionEndedAt: null,
    expiresAt: null,
    messages: [],
    funnelMessages: [],
    messageCount: 0,
  };
}

function restartFunnelSession(session, reason) {
  return {
    ...session,
    ...clearedFunnelFields(),
    state: SESSION_STATES.SESSION_ENDED,
    funnelVersion: FUNNEL_VERSION,
    lastMessageAt: Date.now(),
    _lifecycleReset: reason,
  };
}

function applySessionLifecycle(session, nowMs = Date.now()) {
  if (!session) return null;

  const normalized = {
    ...session,
    userId: canonicalUserId(session.userId),
    funnelVersion: session.funnelVersion ?? 1,
  };

  if (normalized.funnelVersion < FUNNEL_VERSION) {
    return restartFunnelSession(normalized, 'funnel_version');
  }

  if (
    normalized.state === SESSION_STATES.ACTIVE &&
    normalized.expiresAt &&
    normalized.expiresAt <= nowMs
  ) {
    return {
      ...normalized,
      state: SESSION_STATES.SESSION_ENDED,
      expiresAt: null,
      sessionEndedAt: nowMs,
      _lifecycleReset: 'session_expired',
    };
  }

  const idleMs = nowMs - (normalized.lastMessageAt || normalized.createdAt || nowMs);

  if (
    (normalized.state === SESSION_STATES.AWAITING_FREE_SIGNAL_2 ||
      normalized.state === SESSION_STATES.AWAITING_FREE_SIGNAL_3 ||
      normalized.state === SESSION_STATES.AWAITING_HOOK_RESPONSE ||
      normalized.state === SESSION_STATES.AWAITING_PAYMENT) &&
    idleMs >= STALE_MID_FUNNEL_MS
  ) {
    return restartFunnelSession(normalized, 'stale_mid_funnel');
  }

  if (
    normalized.state === SESSION_STATES.AWAITING_BIRTH_DATE &&
    idleMs >= STALE_BIRTH_DATE_MS
  ) {
    return restartFunnelSession(normalized, 'stale_birth_date');
  }

  return normalized;
}

module.exports = {
  canonicalUserId,
  applySessionLifecycle,
  restartFunnelSession,
  clearedFunnelFields,
};
