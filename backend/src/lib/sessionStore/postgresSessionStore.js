const { getPool } = require('../db');
const { toDate, toMs } = require('./sessionMapper');

function rowToRecord(row) {
  if (!row) return null;

  return {
    userId: row.user_id,
    state: row.state,
    funnelVersion: row.funnel_version,
    createdAt: toMs(row.created_at),
    lastMessageAt: toMs(row.last_message_at),
    expiresAt: toMs(row.expires_at),
    paymentReceivedAt: toMs(row.payment_received_at),
    sessionStartedAt: toMs(row.session_started_at),
    sessionEndedAt: toMs(row.session_ended_at),
    birthDate: row.birth_date,
    birthTime: row.birth_time,
    location: row.location,
    ageVerified: row.age_verified,
    numerology: row.numerology,
    paymentData: row.payment_data,
    messageCount: row.message_count,
    messages: row.messages || [],
  };
}

const SELECT_FIELDS = `
  user_id, state, funnel_version, created_at, last_message_at, expires_at,
  payment_received_at, session_started_at, session_ended_at,
  birth_date, birth_time, location, age_verified,
  numerology, payment_data, message_count, messages
`;

async function getSessionRecord(userId) {
  const { rows } = await getPool().query(
    `SELECT ${SELECT_FIELDS} FROM sessions WHERE user_id = $1`,
    [userId]
  );
  return rowToRecord(rows[0]);
}

async function saveSessionRecord(session) {
  await getPool().query(
    `INSERT INTO sessions (
      user_id, state, funnel_version, created_at, last_message_at, expires_at,
      payment_received_at, session_started_at, session_ended_at,
      birth_date, birth_time, location, age_verified,
      numerology, payment_data, message_count, messages
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
    )
    ON CONFLICT (user_id) DO UPDATE SET
      state = EXCLUDED.state,
      funnel_version = EXCLUDED.funnel_version,
      created_at = EXCLUDED.created_at,
      last_message_at = EXCLUDED.last_message_at,
      expires_at = EXCLUDED.expires_at,
      payment_received_at = EXCLUDED.payment_received_at,
      session_started_at = EXCLUDED.session_started_at,
      session_ended_at = EXCLUDED.session_ended_at,
      birth_date = EXCLUDED.birth_date,
      birth_time = EXCLUDED.birth_time,
      location = EXCLUDED.location,
      age_verified = EXCLUDED.age_verified,
      numerology = EXCLUDED.numerology,
      payment_data = EXCLUDED.payment_data,
      message_count = EXCLUDED.message_count,
      messages = EXCLUDED.messages`,
    [
      session.userId,
      session.state,
      session.funnelVersion ?? 1,
      toDate(session.createdAt),
      toDate(session.lastMessageAt),
      toDate(session.expiresAt),
      toDate(session.paymentReceivedAt),
      toDate(session.sessionStartedAt),
      toDate(session.sessionEndedAt),
      session.birthDate,
      session.birthTime,
      session.location,
      Boolean(session.ageVerified),
      session.numerology ? JSON.stringify(session.numerology) : null,
      session.paymentData ? JSON.stringify(session.paymentData) : null,
      session.messageCount ?? 0,
      JSON.stringify(session.messages ?? []),
    ]
  );
}

async function getAllSessionRecords() {
  const { rows } = await getPool().query(
    `SELECT ${SELECT_FIELDS} FROM sessions ORDER BY last_message_at DESC`
  );
  return rows.map(rowToRecord);
}

async function findExpiredActiveSessions(state, nowMs) {
  const { rows } = await getPool().query(
    `SELECT ${SELECT_FIELDS} FROM sessions
     WHERE state = $1 AND expires_at IS NOT NULL AND expires_at <= $2`,
    [state, toDate(nowMs)]
  );
  return rows.map(rowToRecord);
}

function getStoreLabel() {
  const url = process.env.DATABASE_URL || '';
  if (!url) return 'postgresql (DATABASE_URL not set)';
  try {
    const parsed = new URL(url);
    return `postgresql://${parsed.hostname}:${parsed.port || 5432}${parsed.pathname}`;
  } catch {
    return 'postgresql';
  }
}

module.exports = {
  getSessionRecord,
  saveSessionRecord,
  getAllSessionRecords,
  findExpiredActiveSessions,
  getStoreLabel,
};
