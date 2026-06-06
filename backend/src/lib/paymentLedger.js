const fs = require('fs');
const path = require('path');
const { getPool } = require('./db');
const { isPostgresStore } = require('./sessionStore');
const { getAllSessionRecords } = require('./sessionStore');
const { buildPaymentFingerprint } = require('../services/paymentService');

const JSON_LEDGER_PATH = path.join(__dirname, '../../data/payment_redemptions.json');

function loadJsonLedger() {
  try {
    if (!fs.existsSync(JSON_LEDGER_PATH)) return {};
    const raw = fs.readFileSync(JSON_LEDGER_PATH, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to read payment ledger, starting fresh:', err.message);
    return {};
  }
}

function saveJsonLedger(ledger) {
  fs.mkdirSync(path.dirname(JSON_LEDGER_PATH), { recursive: true });
  fs.writeFileSync(JSON_LEDGER_PATH, JSON.stringify(ledger, null, 2));
}

async function findRedemptionInSessions(fingerprint) {
  const sessions = await getAllSessionRecords();

  for (const session of sessions) {
    if (!session.paymentReceivedAt || !session.paymentData) continue;

    const sessionFingerprint =
      session.paymentData.fingerprint || buildPaymentFingerprint(session.paymentData);
    if (sessionFingerprint && sessionFingerprint === fingerprint) {
      return {
        userId: session.userId,
        redeemedAt: session.paymentReceivedAt,
        source: 'session',
      };
    }
  }

  return null;
}

async function findRedemption(fingerprint) {
  if (isPostgresStore()) {
    const { rows } = await getPool().query(
      `SELECT user_id, redeemed_at
       FROM payment_redemptions
       WHERE fingerprint = $1`,
      [fingerprint]
    );

    if (rows[0]) {
      return {
        userId: rows[0].user_id,
        redeemedAt: rows[0].redeemed_at?.getTime?.() || rows[0].redeemed_at,
        source: 'ledger',
      };
    }
  } else {
    const ledger = loadJsonLedger();
    const entry = ledger[fingerprint];
    if (entry) {
      return {
        userId: entry.userId,
        redeemedAt: entry.redeemedAt,
        source: 'ledger',
      };
    }
  }

  return findRedemptionInSessions(fingerprint);
}

async function registerRedemption(fingerprint, userId, paymentData) {
  const payload = {
    userId,
    operationNumber: paymentData.operationNumber || null,
    paymentDateTime: paymentData.dateTime || null,
    amount: paymentData.amount ?? null,
    redeemedAt: Date.now(),
  };

  if (isPostgresStore()) {
    await getPool().query(
      `INSERT INTO payment_redemptions (
        fingerprint, user_id, operation_number, payment_datetime, amount, redeemed_at
      ) VALUES ($1, $2, $3, $4, $5, to_timestamp($6 / 1000.0))
      ON CONFLICT (fingerprint) DO NOTHING`,
      [
        fingerprint,
        userId,
        payload.operationNumber,
        payload.paymentDateTime,
        payload.amount,
        payload.redeemedAt,
      ]
    );
    return;
  }

  const ledger = loadJsonLedger();
  if (!ledger[fingerprint]) {
    ledger[fingerprint] = payload;
    saveJsonLedger(ledger);
  }
}

async function assessPaymentRedemption(paymentData, userId) {
  const fingerprint = buildPaymentFingerprint(paymentData);
  if (!fingerprint) {
    return { allowed: false, reason: 'incomplete', fingerprint: null };
  }

  const existing = await findRedemption(fingerprint);
  if (existing) {
    return {
      allowed: false,
      reason: 'duplicate',
      fingerprint,
      existingUserId: existing.userId,
      redeemedAt: existing.redeemedAt,
    };
  }

  return { allowed: true, fingerprint };
}

module.exports = {
  assessPaymentRedemption,
  registerRedemption,
  findRedemption,
  buildPaymentFingerprint,
};
