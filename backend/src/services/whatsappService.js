const axios = require('axios');
const { config, isTwilioConfigured } = require('../config/env');
const { getTwilioClient, getWhatsAppFrom } = require('../lib/clients/twilio.client');
const { recordReply } = require('../lib/replyCollector');

function ensureWhatsAppAddress(number) {
  const value = String(number);
  if (value.startsWith('whatsapp:')) return value;
  if (value.includes('@')) {
    return `whatsapp:+${value.replace('@s.whatsapp.net', '').replace('+', '')}`;
  }
  return value.startsWith('+') ? `whatsapp:${value}` : `whatsapp:+${value}`;
}

async function sendTextMessage(to, text) {
  recordReply(to, text);

  // Local test mode: capture replies in webhook JSON only — do not call Twilio
  if (config.webhookReturnResponses) {
    return;
  }

  if (!isTwilioConfigured()) {
    return;
  }

  try {
    await getTwilioClient().messages.create({
      from: getWhatsAppFrom(),
      to: ensureWhatsAppAddress(to),
      body: text,
    });
  } catch (err) {
    console.error('Twilio send error:', err?.message || err);
  }
}

async function fetchImageBase64(media) {
  const { accountSid, authToken } = config.twilio;

  const response = await axios.get(media.url, {
    auth: { username: accountSid, password: authToken },
    responseType: 'arraybuffer',
  });

  return {
    base64: Buffer.from(response.data).toString('base64'),
    mimeType: media.contentType || 'image/jpeg',
  };
}

module.exports = { sendTextMessage, fetchImageBase64, ensureWhatsAppAddress };
