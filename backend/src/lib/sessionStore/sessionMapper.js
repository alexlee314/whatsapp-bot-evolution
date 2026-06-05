function toDate(ms) {
  if (ms == null) return null;
  return new Date(Number(ms));
}

function toMs(date) {
  if (date == null) return null;
  return date.getTime();
}

function sessionToRecord(row) {
  if (!row) return null;

  return {
    userId: row.userId,
    state: row.state,
    funnelVersion: row.funnelVersion,
    createdAt: toMs(row.createdAt),
    lastMessageAt: toMs(row.lastMessageAt),
    expiresAt: toMs(row.expiresAt),
    paymentReceivedAt: toMs(row.paymentReceivedAt),
    sessionStartedAt: toMs(row.sessionStartedAt),
    sessionEndedAt: toMs(row.sessionEndedAt),
    birthDate: row.birthDate,
    birthTime: row.birthTime,
    location: row.location,
    ageVerified: row.ageVerified,
    numerology: row.numerology,
    paymentData: row.paymentData,
    messageCount: row.messageCount,
    messages: Array.isArray(row.messages) ? row.messages : [],
  };
}

function recordToSession(record) {
  return {
    userId: record.userId,
    state: record.state,
    funnelVersion: record.funnelVersion ?? 1,
    createdAt: toDate(record.createdAt),
    lastMessageAt: toDate(record.lastMessageAt),
    expiresAt: toDate(record.expiresAt),
    paymentReceivedAt: toDate(record.paymentReceivedAt),
    sessionStartedAt: toDate(record.sessionStartedAt),
    sessionEndedAt: toDate(record.sessionEndedAt),
    birthDate: record.birthDate ?? null,
    birthTime: record.birthTime ?? null,
    location: record.location ?? null,
    ageVerified: Boolean(record.ageVerified),
    numerology: record.numerology ?? null,
    paymentData: record.paymentData ?? null,
    messageCount: record.messageCount ?? 0,
    messages: record.messages ?? [],
  };
}

module.exports = { sessionToRecord, recordToSession, toDate, toMs };
