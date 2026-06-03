const axios = require('axios');

// Evolution API client
const evolutionClient = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,  // e.g. http://localhost:8080
  headers: {
    'apikey': process.env.EVOLUTION_API_KEY,
    'Content-Type': 'application/json',
  },
});

const INSTANCE = process.env.EVOLUTION_INSTANCE; // your instance name

async function sendMessage(to, body) {
  try {
    // Strip 'whatsapp:' prefix if present (Twilio format)
    const number = to.replace('whatsapp:', '').replace('+', '');

    await evolutionClient.post(`/message/sendText/${INSTANCE}`, {
      number,
      text: body,
    });

  } catch (err) {
    console.error('Evolution API send error:', err?.response?.data || err.message);
  }
}

async function sendImage(to, imageUrl, caption = '') {
  try {
    const number = to.replace('whatsapp:', '').replace('+', '');

    await evolutionClient.post(`/message/sendMedia/${INSTANCE}`, {
      number,
      mediatype: 'image',
      media: imageUrl,
      caption,
    });

  } catch (err) {
    console.error('Evolution API send image error:', err?.response?.data || err.message);
  }
}

module.exports = { sendMessage, sendImage };
