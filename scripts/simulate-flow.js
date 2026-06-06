/**
 * Simulates Oráculo Andino free funnel (Twilio webhook).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const BASE = `http://localhost:${process.env.PORT || 3000}`;
const DASH_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin123';
const FROM = 'whatsapp:+51999000088';

function twilioBody(text) {
  return { From: FROM, Body: text, NumMedia: '0' };
}

async function post(text) {
  await axios.post(`${BASE}/webhook`, twilioBody(text), { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 800));
}

async function main() {
  console.log('Simulating Oráculo Andino free funnel...\n');

  await axios.get(`${BASE}/health`);
  console.log('✓ Health OK');

  await post('reiniciar');
  console.log('✓ Step 1: welcome (birth date request)');

  await post('14/02/1995, Lima');
  console.log('✓ Step 2: primera señal + color protector');

  await post('not sure');
  console.log('✓ Step 3: ventana gratis (oracle msg 3)');

  await post('thanks a lot');
  console.log('✓ Step 4: muro de cobro');

  const { data } = await axios.get(`${BASE}/dashboard/data`, {
    headers: { 'X-Dashboard-Password': DASH_PASSWORD },
  });
  const s = data.conversations.find((x) => x.phone === '****0088');

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
