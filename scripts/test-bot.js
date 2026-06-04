/**
 * Integration smoke tests for the WhatsApp bot.
 * Run with: node scripts/test-bot.js
 * Requires the app running: npm run dev (or npm start)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const BASE = `http://localhost:${process.env.PORT || 3000}`;
const DASH_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin123';
const TEST_FROM = 'whatsapp:+51999000001';

function twilioPayload(body, overrides = {}) {
  return {
    From: TEST_FROM,
    Body: body,
    NumMedia: '0',
    ...overrides,
  };
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const results = [];

  // 1. Twilio credentials
  const { isTwilioConfigured } = require('../backend/src/config/env');
  const twilioConfigured = isTwilioConfigured();
  results.push({
    name: 'Twilio .env configured',
    ok: twilioConfigured,
    detail: twilioConfigured ? 'yes' : 'set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM',
  });

  // 2. Bot HTTP server
  try {
    const dash = await axios.get(`${BASE}/dashboard/data`, {
      timeout: 5000,
      headers: { 'X-Dashboard-Password': DASH_PASSWORD },
    });
    results.push({
      name: 'Bot server + dashboard API',
      ok: true,
      detail: `${dash.data.summary.total_conversations} conversation(s) today`,
    });
  } catch (err) {
    results.push({
      name: 'Bot server',
      ok: false,
      detail: err.code === 'ECONNREFUSED'
        ? `not running on ${BASE} — run npm run dev`
        : err.message,
    });
    printResults(results);
    process.exit(1);
  }

  // 3. Webhook — new user flow
  try {
    await axios.post(`${BASE}/webhook`, twilioPayload('hola'), { timeout: 5000 });
    await sleep(800);
    const sessions = await axios.get(`${BASE}/dashboard/data`, {
      headers: { 'X-Dashboard-Password': DASH_PASSWORD },
    });
    const session = sessions.data.conversations.find((s) => s.phone === '****0001');
    const ok = session && session.state === 'WAITING_PAYMENT';
    results.push({
      name: 'Webhook (new user → WAITING_PAYMENT)',
      ok,
      detail: ok ? `state=${session.state}` : `session=${JSON.stringify(session)}`,
    });
  } catch (err) {
    results.push({ name: 'Webhook (new user)', ok: false, detail: err.message });
  }

  // 4. Brain JSON (oan_fin.json)
  try {
    const { loadBrain, BRAIN_PATH } = require('../backend/src/services/oanBrainService');
    const brain = loadBrain();
    const ok = brain.version === '2026.3.0' && brain.motor_algoritmico_numerologia;
    results.push({
      name: 'Brain JSON (data/oan_fin.json)',
      ok,
      detail: ok ? `v${brain.version}` : 'missing or invalid',
    });
  } catch (err) {
    results.push({ name: 'Brain JSON', ok: false, detail: err.message });
  }

  // 5. Numerology + free signals (local, from client doc)
  try {
    const {
      parseBirthDate,
      calculateAge,
      calculateNumerology,
      calculatePersonalYear,
      buildFreeSignalsMessage,
    } = require('../backend/src/services/numerologyService');
    const parsed = parseBirthDate('14/02/1995, Lima');
    const age = calculateAge(parsed.day, parsed.month, parsed.year);
    const nums = calculateNumerology(parsed.day, parsed.month, parsed.year);
    const personalYear = calculatePersonalYear(parsed.day, parsed.month);
    const msg = buildFreeSignalsMessage(nums);
    const ok =
      parsed.location === 'Lima' &&
      age >= 18 &&
      nums.lifePath === 4 &&
      personalYear === 8 &&
      msg.includes('Primera Señal') &&
      msg.includes('952 989 503') === false &&
      msg.includes('poner orden');
    results.push({
      name: 'Numerology + signal bank (14/02/1995)',
      ok,
      detail: ok ? `vida=${nums.lifePath}, año=${personalYear}` : JSON.stringify({ nums, personalYear }),
    });
  } catch (err) {
    results.push({ name: 'Numerology + signals', ok: false, detail: err.message });
  }

  // 6. OpenAI chat (direct module test)
  try {
    const { chatWithGPT } = require('../backend/src/services/openaiService');
    const reply = await chatWithGPT([{ role: 'user', content: 'Reply with exactly: pong' }]);
    const ok = typeof reply === 'string' && reply.length > 0;
    results.push({
      name: 'OpenAI GPT chat',
      ok,
      detail: ok ? reply.slice(0, 80) : 'empty reply',
    });
  } catch (err) {
    results.push({ name: 'OpenAI GPT chat', ok: false, detail: err.message });
  }

  // 7. Twilio SDK available
  try {
    require('twilio');
    results.push({ name: 'Twilio SDK', ok: true, detail: 'installed' });
  } catch (err) {
    results.push({ name: 'Twilio SDK', ok: false, detail: err.message });
  }

  printResults(results);
  const failed = results.filter((r) => !r.ok).length;
  process.exit(failed > 0 ? 1 : 0);
}

function printResults(results) {
  console.log('\n=== WhatsApp Bot Test Results ===\n');
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`);
    console.log(`       ${r.detail}\n`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
