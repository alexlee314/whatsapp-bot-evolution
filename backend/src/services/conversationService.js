const {
  SESSION_STATES,
  SESSION_DURATION_MS,
  MIN_AGE,
  SESSION_WARNING_MINUTES,
} = require('../config/constants');
const {
  MESSAGES,
  sessionTimeWarning,
  buildFreeSignalsMessage,
  buildPaymentWallMessage,
  buildSessionClosing,
} = require('../constants/messages');
const {
  calculateAge,
  calculateNumerology,
  wantsToEndSession,
} = require('../domain/numerology');
const { parseBirthDateFlexible } = require('./birthDateService');
const {
  getSession,
  createSession,
  updateSession,
  touchSession,
  endSession,
  scheduleSessionEnd,
} = require('../models/SessionModel');
const { sendTextMessage } = require('./whatsappService');
const { validatePaymentImage, getPaymentErrorMessage } = require('./paymentService');
const { chatWithGPT } = require('./openaiService');

const RESTART_TRIGGERS = ['reiniciar', 'empezar de nuevo', 'start over', 'reset'];

function wantsSessionRestart(text) {
  const lower = String(text || '').toLowerCase();
  return RESTART_TRIGGERS.some((trigger) => lower.includes(trigger));
}

async function processIncomingMessage({ from, text, hasImage, media }) {
  const session = await getSession(from);

  if (text && wantsSessionRestart(text)) {
    await endSession(from);
    await createSession(from, SESSION_STATES.AWAITING_BIRTH_DATE);
    await sendTextMessage(from, MESSAGES.welcome);
    return;
  }

  if (
    !session ||
    session.state === SESSION_STATES.NEW ||
    session.state === SESSION_STATES.SESSION_ENDED
  ) {
    await createSession(from, SESSION_STATES.AWAITING_BIRTH_DATE);
    await sendTextMessage(from, MESSAGES.welcome);
    return;
  }

  await touchSession(from);

  switch (session.state) {
    case SESSION_STATES.MINOR_REJECTED:
      await sendTextMessage(from, MESSAGES.minorRejected);
      break;

    case SESSION_STATES.AWAITING_BIRTH_DATE:
      await handleBirthDate(from, text);
      break;

    case SESSION_STATES.AWAITING_HOOK_RESPONSE:
      await handleHookResponse(from, text);
      break;

    case SESSION_STATES.AWAITING_PAYMENT:
      await handlePayment(from, hasImage, media);
      break;

    case SESSION_STATES.ACTIVE:
      await handleActiveSession(from, text, session);
      break;

    default:
      break;
  }
}

async function handleBirthDate(from, text) {
  if (!text) {
    await sendTextMessage(from, MESSAGES.birthDateRequired);
    return;
  }

  const parsed = await parseBirthDateFlexible(text);
  if (!parsed) {
    await sendTextMessage(from, MESSAGES.birthDateInvalid);
    return;
  }

  if (calculateAge(parsed.day, parsed.month, parsed.year) < MIN_AGE) {
    await updateSession(from, { state: SESSION_STATES.MINOR_REJECTED });
    await sendTextMessage(from, MESSAGES.minorRejected);
    return;
  }

  const numerology = calculateNumerology(parsed.day, parsed.month, parsed.year);

  await updateSession(from, {
    state: SESSION_STATES.AWAITING_HOOK_RESPONSE,
    birthDate: numerology.birthDateLabel,
    birthTime: parsed.timeOfBirth || null,
    location: parsed.location,
    ageVerified: true,
    numerology,
  });

  await sendTextMessage(from, buildFreeSignalsMessage(numerology));
}

async function handleHookResponse(from, text) {
  if (!text) {
    await sendTextMessage(from, 'Cuéntame con un sí o no si sientes que eso te describe hoy ✨.');
    return;
  }

  await updateSession(from, { state: SESSION_STATES.AWAITING_PAYMENT });
  await sendTextMessage(from, buildPaymentWallMessage());
}

async function handlePayment(from, hasImage, media) {
  if (!hasImage || !media) {
    await sendTextMessage(from, MESSAGES.paymentScreenshotRequired);
    return;
  }

  await sendTextMessage(from, MESSAGES.paymentValidating);

  const validation = await validatePaymentImage(media);
  if (!validation.isValid) {
    await sendTextMessage(from, getPaymentErrorMessage(validation.reason));
    return;
  }

  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const now = Date.now();

  await updateSession(from, {
    state: SESSION_STATES.ACTIVE,
    expiresAt,
    paymentData: validation.data,
    paymentReceivedAt: now,
    sessionStartedAt: now,
    messages: [{ role: 'assistant', content: MESSAGES.paymentConfirmed }],
  });

  scheduleSessionEnd(from, SESSION_DURATION_MS, () => endSessionGracefully(from));
  await sendTextMessage(from, MESSAGES.paymentConfirmed);
}

async function handleActiveSession(from, text, session) {
  if (Date.now() > session.expiresAt) {
    await endSessionGracefully(from);
    return;
  }

  if (!text) {
    await sendTextMessage(from, MESSAGES.activeSessionPrompt);
    return;
  }

  if (wantsToEndSession(text)) {
    await endSessionGracefully(from);
    return;
  }

  const minutesLeft = Math.round((session.expiresAt - Date.now()) / 60000);
  const contextPrefix = buildNumerologyContext(session);
  const messages = [...session.messages, { role: 'user', content: contextPrefix + text }];

  const reply = await chatWithGPT(messages);
  messages.push({ role: 'assistant', content: reply });
  await updateSession(from, { messages });

  const suffix =
    minutesLeft <= SESSION_WARNING_MINUTES ? sessionTimeWarning(minutesLeft) : '';

  await sendTextMessage(from, reply + suffix);
}

function buildNumerologyContext(session) {
  if (!session.numerology) return '';

  const locationPart = session.location ? `, Ubicación: ${session.location}` : '';
  const timePart = session.birthTime ? `, Hora de nacimiento: ${session.birthTime}` : '';

  return (
    `[Contexto numerológico — Número de vida: ${session.numerology.lifePath}, ` +
    `Año personal: ${session.numerology.personalYear}, Color: ${session.numerology.color}, ` +
    `Fecha: ${session.birthDate}${timePart}${locationPart}]\n\n`
  );
}

async function endSessionGracefully(from) {
  const session = await getSession(from);

  if (!session || session.state !== SESSION_STATES.ACTIVE) {
    await endSession(from);
    return;
  }

  const closing = session.numerology
    ? buildSessionClosing(session.numerology)
    : MESSAGES.paymentConfirmed;

  await sendTextMessage(from, closing);
  await endSession(from);
}

module.exports = { processIncomingMessage, endSessionGracefully, SESSION_STATES };
