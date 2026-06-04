/**
 * Simulates Oráculo Andino text flow (greet + payment on first message).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const BASE = `http://localhost:${process.env.PORT || 3000}`;
const DASH_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin123';
const FROM = 'whatsapp:+51999000099';

function twilioBody(text) {
  return { From: FROM, Body: text, NumMedia: '0' };
}

async function post(text) {
  await axios.post(`${BASE}/webhook`, twilioBody(text), { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 600));
}

async function main() {
  console.log('Simulating Oráculo Andino flow...\n');

  await axios.get(`${BASE}/health`);
  console.log('✓ Health OK');

  await post('Hola');
  console.log('✓ Step 1: greet + payment request');

  const { data } = await axios.get(`${BASE}/dashboard/data`, {
    headers: { 'X-Dashboard-Password': DASH_PASSWORD },
  });
  const s = data.conversations.find((x) => x.phone === '****0099');

  if (!s) throw new Error('Session not found');
  console.log('\nSession state:', s.state);

  if (s.state !== 'WAITING_PAYMENT') {
    throw new Error(`Expected WAITING_PAYMENT, got ${s.state}`);
  }

  console.log('\n✓ Flow OK. Next: send Yape screenshot.');
}

main().catch((err) => {
  console.error('FAIL:', err.response?.data || err.message);
  process.exit(1);
});
