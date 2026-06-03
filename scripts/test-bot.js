/**
 * Integration smoke tests for the WhatsApp bot.
 * Run with: node scripts/test-bot.js
 * Requires the app running: npm run dev (or npm start)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const BASE = `http://localhost:${process.env.PORT || 3000}`;
const TEST_USER = '51999000001@s.whatsapp.net';

function webhookPayload(overrides = {}) {
  return {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: TEST_USER,
        fromMe: false,
      },
      message: {
        conversation: 'hello test',
      },
      ...overrides.data,
    },
    ...overrides,
  };
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const results = [];

  // 1. Evolution API reachability
  try {
    await axios.get(process.env.EVOLUTION_API_URL, { timeout: 3000 });
    results.push({ name: 'Evolution API', ok: true, detail: 'reachable' });
  } catch (err) {
    results.push({
      name: 'Evolution API',
      ok: false,
      detail: err.code === 'ECONNREFUSED'
        ? `not running at ${process.env.EVOLUTION_API_URL}`
        : err.message,
    });
  }

  // 2. Bot HTTP server
  try {
    const dash = await axios.get(`${BASE}/dashboard/api/sessions`, { timeout: 5000 });
    results.push({
      name: 'Bot server + dashboard API',
      ok: true,
      detail: `${dash.data.length} session(s)`,
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
    await axios.post(`${BASE}/webhook`, webhookPayload(), { timeout: 5000 });
    await sleep(800);
    const sessions = await axios.get(`${BASE}/dashboard/api/sessions`);
    const session = sessions.data.find((s) => s.userId.includes('51999000001'));
    const ok = session && session.state === 'AWAITING_PAYMENT';
    results.push({
      name: 'Webhook (new user → AWAITING_PAYMENT)',
      ok,
      detail: ok ? `state=${session.state}` : `session=${JSON.stringify(session)}`,
    });
  } catch (err) {
    results.push({ name: 'Webhook (new user)', ok: false, detail: err.message });
  }

  // 4. Webhook — text while awaiting payment
  try {
    await axios.post(
      `${BASE}/webhook`,
      webhookPayload({
        data: {
          key: { remoteJid: TEST_USER, fromMe: false },
          message: { conversation: 'where is payment?' },
        },
      }),
      { timeout: 5000 }
    );
    await sleep(500);
    results.push({
      name: 'Webhook (awaiting payment, no image)',
      ok: true,
      detail: 'accepted (Evolution send may fail if API not configured)',
    });
  } catch (err) {
    results.push({ name: 'Webhook (awaiting payment)', ok: false, detail: err.message });
  }

  // 5. OpenAI chat (direct module test)
  try {
    const { chatWithGPT } = require('../src/services/openaiService');
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

  // 6. Evolution credentials check
  const evoConfigured =
    process.env.EVOLUTION_API_KEY &&
    process.env.EVOLUTION_API_KEY !== 'your_evolution_api_key_here' &&
    process.env.EVOLUTION_INSTANCE &&
    process.env.EVOLUTION_INSTANCE !== 'your_instance_name_here';
  results.push({
    name: 'Evolution .env configured',
    ok: evoConfigured,
    detail: evoConfigured ? 'yes' : 'still using placeholder values in .env',
  });

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
