const axios = require('axios');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Evolution API client for downloading media
const evolutionClient = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,
  headers: {
    'apikey': process.env.EVOLUTION_API_KEY,
    'Content-Type': 'application/json',
  },
});

const INSTANCE = process.env.EVOLUTION_INSTANCE;

async function validatePaymentImage(imageMessage, from) {
  try {
    // Download the image via Evolution API
    const number = from.replace('@s.whatsapp.net', '');
    const mediaResponse = await evolutionClient.post(
      `/chat/getBase64FromMediaMessage/${INSTANCE}`,
      {
        message: { imageMessage },
        convertToMp4: false,
      }
    );

    const base64Image = mediaResponse.data?.base64;
    if (!base64Image) throw new Error('Could not extract image data');

    const mimeType = imageMessage?.mimetype || 'image/jpeg';

    // Send to GPT-4 Vision for OCR validation
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: `Analyze this image. Is it a payment receipt or transaction confirmation (from Yape, Mercado Pago, or any payment app)?

If yes, extract:
- amount (number only)
- currency
- date
- reference or transaction ID (if visible)

Respond ONLY in this JSON format, no extra text:
{
  "isPayment": true or false,
  "amount": "...",
  "currency": "...",
  "date": "...",
  "reference": "..."
}

If it is not a payment receipt, set isPayment to false.`,
            },
          ],
        },
      ],
    });

    const raw = response.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (!parsed.isPayment) {
      return { isValid: false, data: null };
    }

    return { isValid: true, data: parsed };

  } catch (err) {
    console.error('OCR validation error:', err.message);
    return { isValid: false, data: null };
  }
}

module.exports = { validatePaymentImage };
