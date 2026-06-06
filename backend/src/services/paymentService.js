const { openai } = require('../lib/clients/openai.client');
const { MIN_PAYMENT_PEN, YAPE_PHONE, YAPE_PHONE_DISPLAY } = require('../config/constants');
const { MESSAGES } = require('../constants/messages');
const { normalizeDigits } = require('../utils/phone');
const { fetchImageBase64 } = require('./whatsappService');

const YAPE_SUFFIX = YAPE_PHONE.slice(-3);

const PAYMENT_IMAGE_EXTRACTION_PROMPT = `Analiza SOLO los píxeles de esta imagen. No busques en internet.

Es un comprobante de pago peruano exitoso si muestra transferencia completada por Yape o Plin hacia el Oráculo Andino.

FORMATO A — Yape (pantalla morada, logo Yape):
- Éxito: "¡Yapeaste!" o similar
- Monto: "S/ X.XX" (ej. S/ 4.90)
- Fecha/hora: ej. "05 jun. 2026 | 05:50 p. m."
- "Nro. de celular" en DATOS DE LA TRANSACCIÓN: suele estar enmascarado, ej. "** *** 503" (últimos dígitos visibles 503)
- "Nro. de operación": ej. 23667502
- Destino puede decir "Yape"

FORMATO B — Plin (Scotiabank u otro banco, logo Plin):
- Éxito: "Pagaste con Plin"
- Monto: "S/ X.XX"
- "Fecha y hora": ej. "29 abr., 04:32 p. m."
- "Destino": cuenta enmascarada terminada en 503 + texto "Yape" (pago a Yape del destinatario)
- "Nº de operación" / "Nro. de operación": ej. 784.444.037.7184

DESTINO VÁLIDO: número o cuenta cuyos dígitos visibles terminan en 503 (Yape ${YAPE_PHONE_DISPLAY}).

Responde SOLO JSON (sin markdown):
{
  "isPayment": true|false,
  "isSuccessful": true|false,
  "paymentApp": "yape"|"plin"|"other"|null,
  "amount": "monto numérico en soles sin símbolo",
  "currency": "PEN",
  "dateTime": "fecha y hora visibles o null",
  "destinationPhone": "solo dígitos visibles del celular/cuenta destino (ej. 503 o 952989503)",
  "destinationText": "texto del campo Destino si existe, o null",
  "operationNumber": "nro de operación sin puntos si puedes, o null",
  "reference": "alias de operationNumber o null"
}

Si no es comprobante de pago exitoso, isPayment=false.`;

function parseAmount(amount) {
  const normalized = String(amount || '')
    .replace(/[^\d.,]/g, '')
    .replace(',', '.');
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function normalizePaymentDateTime(dateTime) {
  return String(dateTime || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/[|]/g, ' ')
    .trim();
}

function buildPaymentFingerprint(data) {
  const operationNumber = normalizeDigits(data?.operationNumber || data?.reference);
  if (operationNumber.length >= 6) {
    return `op:${operationNumber}`;
  }

  const amount =
    typeof data?.amount === 'number' ? data.amount : parseAmount(data?.amount);
  const dateTime = normalizePaymentDateTime(data?.dateTime);
  if (dateTime && amount !== null) {
    return `dt:${dateTime}:${amount.toFixed(2)}`;
  }

  return null;
}

function matchesYapeDestination(destinationPhone, extras = {}) {
  const digits = normalizeDigits(destinationPhone);
  const destText = String(extras.destinationText || '').toLowerCase();
  const paymentApp = String(extras.paymentApp || '').toLowerCase();
  const mentionsYape = destText.includes('yape') || paymentApp === 'yape' || paymentApp === 'plin';

  if (digits === YAPE_PHONE) return true;

  if (digits.length >= 3 && YAPE_PHONE.endsWith(digits)) {
    return true;
  }

  if (digits === YAPE_SUFFIX || (digits.endsWith(YAPE_SUFFIX) && digits.length <= 9)) {
    return mentionsYape || digits.length === 3;
  }

  if (mentionsYape && digits.endsWith(YAPE_SUFFIX)) {
    return true;
  }

  return false;
}

function parsePaymentOcrJson(raw) {
  const text = String(raw || '').trim();
  if (!text) throw new Error('Empty OCR response');

  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) throw new Error('OCR response is not JSON');
    return JSON.parse(text.slice(start, end + 1));
  }
}

function isSuccessfulPayment(parsed) {
  if (!parsed.isPayment) return false;
  if (parsed.isSuccessful === false) return false;
  return true;
}

function passesDestinationCheck(parsed) {
  if (
    matchesYapeDestination(parsed.destinationPhone, {
      destinationText: parsed.destinationText,
      paymentApp: parsed.paymentApp,
    })
  ) {
    return true;
  }

  const app = String(parsed.paymentApp || '').toLowerCase();
  const destText = String(parsed.destinationText || '').toLowerCase();
  const digits = normalizeDigits(parsed.destinationPhone);
  const operation = normalizeDigits(parsed.operationNumber || parsed.reference);

  // Yape purple receipt: "Destino: Yape" + "Nro. de celular ***503" + operation number
  if (app === 'yape' && destText.includes('yape') && operation.length >= 6) {
    if (!digits || digits === YAPE_SUFFIX || YAPE_PHONE.endsWith(digits)) {
      return true;
    }
  }

  // Plin → Yape: destino enmascarado terminado en 503
  if (app === 'plin' && destText.includes('yape') && digits.endsWith(YAPE_SUFFIX)) {
    return true;
  }

  return false;
}

function validatePaymentRules(parsed) {
  if (!isSuccessfulPayment(parsed)) {
    return { isValid: false, reason: 'not_payment' };
  }

  const amount = parseAmount(parsed.amount);
  if (amount === null || amount < MIN_PAYMENT_PEN) {
    return { isValid: false, reason: 'amount' };
  }

  if (!passesDestinationCheck(parsed)) {
    return { isValid: false, reason: 'destination' };
  }

  const operationNumber =
    parsed.operationNumber || parsed.reference
      ? String(parsed.operationNumber || parsed.reference).replace(/\D/g, '') || null
      : null;
  const dateTime = parsed.dateTime ? String(parsed.dateTime).trim() : null;
  const paymentData = {
    ...parsed,
    amount,
    operationNumber,
    dateTime,
  };
  const fingerprint = buildPaymentFingerprint(paymentData);

  return {
    isValid: true,
    data: {
      ...paymentData,
      fingerprint,
    },
  };
}

function getPaymentErrorMessage(reason) {
  if (reason === 'amount') return MESSAGES.paymentInvalidAmount;
  if (reason === 'destination') return MESSAGES.paymentInvalidDestination;
  if (reason === 'duplicate') return MESSAGES.paymentAlreadyUsed;
  if (reason === 'incomplete') return MESSAGES.paymentIncompleteReceipt;
  if (reason === 'error') {
    return 'No pude leer tu captura. Envía la foto del comprobante *Yape* o *Plin* completa, nítida y con el monto *S/ 4.90* visible ✨.';
  }
  return MESSAGES.paymentInvalidDefault;
}

async function validatePaymentImage(media) {
  try {
    const { base64, mimeType } = await fetchImageBase64(media);
    if (!base64) throw new Error('Could not extract image data');

    const { config } = require('../config/env');
    const response = await openai.chat.completions.create({
      model: config.openaiChatModel || 'gpt-4o',
      max_tokens: 400,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            { type: 'text', text: PAYMENT_IMAGE_EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    const parsed = parsePaymentOcrJson(raw);
    const result = validatePaymentRules(parsed);

    if (!result.isValid) {
      console.warn('Payment OCR rejected:', result.reason, JSON.stringify(parsed));
    }

    return result;
  } catch (err) {
    console.error('Payment validation error:', err.message);
    return { isValid: false, data: null, reason: 'error' };
  }
}

module.exports = {
  validatePaymentImage,
  validatePaymentRules,
  buildPaymentFingerprint,
  normalizePaymentDateTime,
  matchesYapeDestination,
  passesDestinationCheck,
  parsePaymentOcrJson,
  getPaymentErrorMessage,
  PAYMENT_IMAGE_EXTRACTION_PROMPT,
  MIN_PAYMENT_PEN,
  YAPE_PHONE,
};
