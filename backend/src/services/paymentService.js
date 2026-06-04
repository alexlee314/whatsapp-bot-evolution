const { openai } = require('../lib/clients/openai.client');
const { MIN_PAYMENT_PEN, YAPE_PHONE } = require('../config/constants');
const { MESSAGES } = require('../constants/messages');
const { normalizeDigits } = require('../utils/phone');
const { fetchImageBase64 } = require('./whatsappService');

function parseAmount(amount) {
  const normalized = String(amount || '')
    .replace(/[^\d.,]/g, '')
    .replace(',', '.');
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function validatePaymentRules(parsed) {
  if (!parsed.isPayment) {
    return { isValid: false, reason: 'not_payment' };
  }

  const amount = parseAmount(parsed.amount);
  if (amount === null || amount < MIN_PAYMENT_PEN) {
    return { isValid: false, reason: 'amount' };
  }

  const destination = normalizeDigits(parsed.destinationPhone);
  if (!destination.includes(YAPE_PHONE)) {
    return { isValid: false, reason: 'destination' };
  }

  return { isValid: true, data: { ...parsed, amount } };
}

function getPaymentErrorMessage(reason) {
  if (reason === 'amount') return MESSAGES.paymentInvalidAmount;
  if (reason === 'destination') return MESSAGES.paymentInvalidDestination;
  return MESSAGES.paymentInvalidDefault;
}

async function validatePaymentImage(media) {
  try {
    const { base64, mimeType } = await fetchImageBase64(media);
    if (!base64) throw new Error('Could not extract image data');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 350,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: 'text',
              text: `Analiza esta imagen. ¿Es un comprobante de pago Yape (u otra app de pago peruana) exitoso?

Extrae y responde SOLO en JSON (sin markdown):
{
  "isPayment": true o false,
  "amount": "monto numérico en soles",
  "currency": "PEN",
  "date": "fecha visible o null",
  "destinationPhone": "número de teléfono destino visible (solo dígitos si puedes)",
  "reference": "código de operación o null",
  "isSuccessful": true o false
}

Si no es comprobante de pago, isPayment debe ser false.`,
            },
          ],
        },
      ],
    });

    const raw = response.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (!parsed.isPayment || parsed.isSuccessful === false) {
      return { isValid: false, data: null, reason: 'not_payment' };
    }

    return validatePaymentRules(parsed);
  } catch (err) {
    console.error('Payment validation error:', err.message);
    return { isValid: false, data: null, reason: 'error' };
  }
}

module.exports = {
  validatePaymentImage,
  validatePaymentRules,
  getPaymentErrorMessage,
  MIN_PAYMENT_PEN,
  YAPE_PHONE,
};
