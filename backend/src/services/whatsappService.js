const axios = require('axios');
const { config, isTwilioConfigured } = require('../config/env');
const { getTwilioClient } = require('../lib/clients/twilio.client');
const { getActiveReplyFrom } = require('../lib/replyContext');
const { recordReply } = require('../lib/replyCollector');
const { withTimeout } = require('../lib/withTimeout');

const typingSessions = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureWhatsAppAddress(number) {
  const value = String(number);
  if (value.startsWith('whatsapp:')) return value;
  if (value.includes('@')) {
    return `whatsapp:+${value.replace('@s.whatsapp.net', '').replace('+', '')}`;
  }
  return value.startsWith('+') ? `whatsapp:${value}` : `whatsapp:+${value}`;
}

function isValidTwilioMessageSid(messageSid) {
  const sid = String(messageSid || '').trim();
  return /^SM[a-f0-9]{32}$/i.test(sid) || /^MM[a-f0-9]{32}$/i.test(sid);
}

function getTypingMinMs() {
  const value = Number(process.env.TWILIO_TYPING_MIN_MS);
  return Number.isFinite(value) && value >= 0 ? value : 1200;
}

function beginTypingSession(userId, messageSid) {
  if (!userId || !messageSid) return;

  typingSessions.set(userId, {
    messageSid: String(messageSid).trim(),
    startedAt: Date.now(),
  });
}

function clearTypingSession(userId) {
  typingSessions.delete(userId);
}

async function sendTypingIndicator(messageSid) {
  if (!messageSid || config.webhookReturnResponses || !isTwilioConfigured()) {
    return false;
  }

  if (!config.twilioTypingIndicator) {
    return false;
  }

  const sid = String(messageSid).trim();
  if (!isValidTwilioMessageSid(sid)) {
    return false;
  }

  const { accountSid, authToken } = config.twilio;
  const params = new URLSearchParams({ messageId: sid, channel: 'whatsapp' });

  try {
    await axios.post('https://messaging.twilio.com/v2/Indicators/Typing.json', params.toString(), {
      auth: { username: accountSid, password: authToken },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 5000,
    });
    return true;
  } catch (err) {
    const detail = err?.response?.data?.message || err?.message;
    console.error('Twilio typing indicator error:', detail);
    return false;
  }
}

async function beginTypingForUser(userId, messageSid) {
  const ok = await sendTypingIndicator(messageSid);
  if (ok) {
    beginTypingSession(userId, messageSid);
  }
}

async function refreshTypingForUser(userId) {
  const session = typingSessions.get(userId);
  if (!session) return false;
  return sendTypingIndicator(session.messageSid);
}

function startTypingRefresh(userId, intervalMs = 20000) {
  if (!config.twilioTypingIndicator || !typingSessions.has(userId)) {
    return () => {};
  }

  const timer = setInterval(() => {
    refreshTypingForUser(userId).catch(() => {});
  }, intervalMs);

  return () => clearInterval(timer);
}

async function waitForTypingDisplay(userId) {
  const session = typingSessions.get(userId);
  if (!session) return;

  const minMs = getTypingMinMs();
  const elapsed = Date.now() - session.startedAt;
  if (elapsed < minMs) {
    await sleep(minMs - elapsed);
  }
}

async function sendTextMessage(to, text) {
  await waitForTypingDisplay(to);

  recordReply(to, text);

  if (config.webhookReturnResponses) {
    clearTypingSession(to);
    return;
  }

  if (!isTwilioConfigured()) {
    console.error('Twilio send skipped: not configured');
    clearTypingSession(to);
    return;
  }

  const from = getActiveReplyFrom();
  const toAddress = ensureWhatsAppAddress(to);

  try {
    const message = await withTimeout(
      getTwilioClient().messages.create({
        from,
        to: toAddress,
        body: text,
      }),
      15000,
      'Twilio send'
    );
    console.log('Twilio sent:', { from, to: toAddress, sid: message.sid, len: text.length });
  } catch (err) {
    console.error('Twilio send error:', {
      code: err.code,
      message: err.message,
      from,
      to: toAddress,
    });
  } finally {
    clearTypingSession(to);
  }
}

async function fetchImageBase64(media) {
  const { accountSid, authToken } = config.twilio;
  const url = String(media?.url || '').trim();

  if (!url) {
    throw new Error('Missing media URL');
  }

  try {
    const response = await axios.get(url, {
      auth: { username: accountSid, password: authToken },
      responseType: 'arraybuffer',
      timeout: 30000,
      maxRedirects: 5,
    });

    const contentType = media.contentType || response.headers['content-type'] || 'image/jpeg';

    return {
      base64: Buffer.from(response.data).toString('base64'),
      mimeType: contentType.split(';')[0].trim(),
    };
  } catch (err) {
    const detail = err?.response?.status || err?.message;
    console.error('Twilio media fetch error:', detail, url.slice(0, 80));
    throw err;
  }
}

module.exports = {
  sendTextMessage,
  sendTypingIndicator,
  beginTypingForUser,
  refreshTypingForUser,
  startTypingRefresh,
  clearTypingSession,
  fetchImageBase64,
  ensureWhatsAppAddress,
};
