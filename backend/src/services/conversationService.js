const { config } = require('../config/env');
const {
  SESSION_STATES,
  MIN_AGE,
} = require('../config/constants');
const {
  MESSAGES,
  sessionTimeWarning,
  buildFirstFreeSignalMessage,
  buildPaymentWallMessage,
  buildSessionClosing,
} = require('../constants/messages');
const {
  calculateAge,
  calculateNumerology,
  wantsToEndSession,
} = require('../domain/numerology');
const { parseBirthDateFlexible } = require('./birthDateService');
const { replyAfterFirstSignal, buildFunnelHistory, ensureFunnelContext, shouldShowPaymentWall } = require('./freeFunnelService');
const { needsUserClarification, buildUserClarificationReply } = require('./oanBrainService');
const {
  getSession,
  createSession,
  persistSession,
  endSession,
  resetSessionForRestart,
  scheduleSessionEnd,
} = require('../models/SessionModel');
const { sendTextMessage, refreshTypingForUser, startTypingRefresh } = require('./whatsappService');
const { validatePaymentImage, getPaymentErrorMessage } = require('./paymentService');
const { assessPaymentRedemption, registerRedemption } = require('../lib/paymentLedger');
const { chatWithGPT } = require('./openaiService');
const {
  buildPaidSessionScopeReply,
  buildPaidSessionFallbackReply,
  isPaymentWallLikeReply,
  isSessionScopeQuestion,
  isQuestionChallenge,
  isInstitutionalQuestion,
  buildInstitutionalReply,
  buildRepurchaseWallMessage,
  wantsRepurchaseSession,
} = require('./oanBrainService');

const RESTART_TRIGGERS = ['reiniciar', 'empezar de nuevo', 'start over', 'reset'];
const RECENT_SESSION_MS = 24 * 60 * 60 * 1000;

function wantsSessionRestart(text) {
  const lower = String(text || '').toLowerCase();
  return RESTART_TRIGGERS.some((trigger) => lower.includes(trigger));
}

function isRecentSession(session) {
  const last = session.lastMessageAt || session.createdAt || 0;
  return Date.now() - last <= RECENT_SESSION_MS;
}

function hasCompletedPayment(session) {
  return Boolean(session?.paymentReceivedAt || session?.paymentData);
}

function isPaidSessionActive(session) {
  return (
    hasCompletedPayment(session) &&
    session.expiresAt &&
    Date.now() < session.expiresAt
  );
}

function inferFunnelStateFromSession(session) {
  if (!session.numerology) return SESSION_STATES.AWAITING_BIRTH_DATE;

  if (hasCompletedPayment(session)) {
    return isPaidSessionActive(session) ? SESSION_STATES.ACTIVE : SESSION_STATES.SESSION_ENDED;
  }

  if (session.state === SESSION_STATES.AWAITING_PAYMENT) {
    return SESSION_STATES.AWAITING_PAYMENT;
  }

  return SESSION_STATES.AWAITING_FREE_SIGNAL_2;
}

async function recoverActiveFunnelSession(session) {
  const recovered = bumpSession(session, {
    state: inferFunnelStateFromSession(session),
    sessionEndedAt: null,
  });
  await persistSession(recovered);
  return recovered;
}

function bumpSession(session, updates = {}) {
  return {
    ...session,
    ...updates,
    lastMessageAt: Date.now(),
    messageCount: (session.messageCount || 0) + 1,
  };
}

async function saveAndReply(from, session, message) {
  await Promise.all([persistSession(session), sendTextMessage(from, message)]);
}

async function processIncomingMessage({ from, text, hasImage, media, messageSid }) {
  await refreshTypingForUser(from);

  const stopTypingRefresh = startTypingRefresh(from);

  try {
    let session = await getSession(from);

    if (text && wantsSessionRestart(text)) {
      await resetSessionForRestart(from);
      await sendTextMessage(from, MESSAGES.welcome);
      return;
    }

    if (!session) {
      await createSession(from, SESSION_STATES.AWAITING_BIRTH_DATE);
      await sendTextMessage(from, MESSAGES.welcome);
      return;
    }

    if (session.state === SESSION_STATES.SESSION_ENDED && session.numerology && isRecentSession(session)) {
      if (hasCompletedPayment(session) && !isPaidSessionActive(session)) {
        if (text && wantsRepurchaseSession(text)) {
          const repurchase = buildRepurchaseWallMessage();
          await saveAndReply(
            from,
            bumpSession(session, { state: SESSION_STATES.AWAITING_PAYMENT }),
            repurchase
          );
          return;
        }

        await saveAndReply(from, bumpSession(session), MESSAGES.paidSessionExpired);
        return;
      }

      session = await recoverActiveFunnelSession(session);
    } else if (session.state === SESSION_STATES.NEW || session.state === SESSION_STATES.SESSION_ENDED) {
      await createSession(from, SESSION_STATES.AWAITING_BIRTH_DATE);
      await sendTextMessage(from, MESSAGES.welcome);
      return;
    }

    switch (session.state) {
      case SESSION_STATES.MINOR_REJECTED:
        await saveAndReply(from, bumpSession(session), MESSAGES.minorRejected);
        break;

      case SESSION_STATES.AWAITING_BIRTH_DATE:
        await handleBirthDate(from, text, session);
        break;

      case SESSION_STATES.AWAITING_FREE_SIGNAL_2:
        await handleFreeSignalStep2(from, text, session);
        break;

      case SESSION_STATES.AWAITING_FREE_SIGNAL_3:
      case SESSION_STATES.AWAITING_HOOK_RESPONSE:
        await handleFreeSignalStep3(from, text, hasImage, media, session);
        break;

      case SESSION_STATES.AWAITING_PAYMENT:
        await handlePayment(from, hasImage, media, session);
        break;

      case SESSION_STATES.ACTIVE:
        await handleActiveSession(from, text, session);
        break;

      default:
        break;
    }
  } finally {
    stopTypingRefresh();
  }
}

async function handleBirthDate(from, text, session) {
  if (!text) {
    await saveAndReply(from, session, MESSAGES.birthDateRequired);
    return;
  }

  const parsed = await parseBirthDateFlexible(text);
  if (!parsed) {
    await saveAndReply(from, session, MESSAGES.birthDateInvalid);
    return;
  }

  if (calculateAge(parsed.day, parsed.month, parsed.year) < MIN_AGE) {
    const rejected = bumpSession(session, { state: SESSION_STATES.MINOR_REJECTED });
    await saveAndReply(from, rejected, MESSAGES.minorRejected);
    return;
  }

  const numerology = calculateNumerology(parsed.day, parsed.month, parsed.year);
  const firstMessage = buildFirstFreeSignalMessage(numerology);
  const updated = bumpSession(session, {
    state: SESSION_STATES.AWAITING_FREE_SIGNAL_2,
    birthDate: numerology.birthDateLabel,
    birthTime: parsed.timeOfBirth || null,
    location: parsed.location,
    ageVerified: true,
    numerology,
    funnelMessages: [{ role: 'assistant', content: firstMessage }],
  });

  await saveAndReply(from, updated, firstMessage);
}

async function handleFreeSignalStep2(from, text, session) {
  if (!text) {
    await saveAndReply(from, session, 'Cuéntame qué sientes al leer esa primera señal ✨.');
    return;
  }

  if (!session.numerology) {
    const reset = bumpSession(session, { state: SESSION_STATES.AWAITING_BIRTH_DATE });
    await saveAndReply(from, reset, MESSAGES.birthDateRequired);
    return;
  }

  const contextualSession = ensureFunnelContext(session, 'after_first_signal');

  if (isInstitutionalQuestion(text)) {
    const reply = buildInstitutionalReply(contextualSession, text);
    await saveAndReply(
      from,
      bumpSession(contextualSession, {
        funnelMessages: buildFunnelHistory(contextualSession, text, reply),
      }),
      reply
    );
    return;
  }

  if (hasCompletedPayment(session)) {
    if (isPaidSessionActive(session)) {
      await handleActiveSession(from, text, session);
    } else {
      await saveAndReply(from, bumpSession(session), MESSAGES.paidSessionExpired);
    }
    return;
  }

  if (shouldShowPaymentWall(contextualSession)) {
    if (needsUserClarification(text)) {
      const clarification = buildUserClarificationReply(text);
      await saveAndReply(
        from,
        bumpSession(contextualSession, {
          funnelMessages: buildFunnelHistory(contextualSession, text, clarification),
        }),
        clarification
      );
      return;
    }

    const paymentMessage = buildPaymentWallMessage(text, session.numerology);
    const updated = bumpSession(contextualSession, {
      state: SESSION_STATES.AWAITING_PAYMENT,
      funnelMessages: buildFunnelHistory(contextualSession, text, paymentMessage),
    });
    await saveAndReply(from, updated, paymentMessage);
    return;
  }

  const followUp = await replyAfterFirstSignal(contextualSession, text);
  await saveAndReply(
    from,
    bumpSession(contextualSession, { funnelMessages: buildFunnelHistory(contextualSession, text, followUp) }),
    followUp
  );
}

async function handleFreeSignalStep3(from, text, hasImage, media, session) {
  if (hasImage && media) {
    const awaitingPayment = bumpSession(session, { state: SESSION_STATES.AWAITING_PAYMENT });
    await handlePayment(from, hasImage, media, awaitingPayment);
    return;
  }

  if (!text) {
    await saveAndReply(from, session, 'Cuéntame si esa segunda señal resuena contigo hoy ✨.');
    return;
  }

  const contextualSession = ensureFunnelContext(session, 'after_second_signal');

  if (isInstitutionalQuestion(text)) {
    const reply = buildInstitutionalReply(contextualSession, text);
    await saveAndReply(
      from,
      bumpSession(contextualSession, {
        funnelMessages: buildFunnelHistory(contextualSession, text, reply),
      }),
      reply
    );
    return;
  }

  if (needsUserClarification(text)) {
    const clarification = buildUserClarificationReply(text);
    await saveAndReply(
      from,
      bumpSession(contextualSession, {
        funnelMessages: buildFunnelHistory(contextualSession, text, clarification),
      }),
      clarification
    );
    return;
  }

  const paymentMessage = buildPaymentWallMessage(text, session.numerology);
  const updated = bumpSession(contextualSession, {
    state: SESSION_STATES.AWAITING_PAYMENT,
    funnelMessages: buildFunnelHistory(contextualSession, text, paymentMessage),
  });
  await saveAndReply(from, updated, paymentMessage);
}

async function handlePayment(from, hasImage, media, session) {
  if (hasCompletedPayment(session)) {
    if (isPaidSessionActive(session)) {
      await saveAndReply(from, bumpSession(session), MESSAGES.alreadyInPaidSession);
    } else {
      await saveAndReply(from, bumpSession(session), MESSAGES.paidSessionExpired);
    }
    return;
  }

  if (!hasImage || !media) {
    console.warn('Payment expected image:', { from, state: session.state, hasImage, mediaUrl: media?.url });
    await saveAndReply(from, bumpSession(session), MESSAGES.paymentScreenshotRequired);
    return;
  }

  await sendTextMessage(from, MESSAGES.paymentValidating);

  const validation = await validatePaymentImage(media);
  if (!validation.isValid) {
    console.warn('Payment rejected:', { from, reason: validation.reason, data: validation.data });
    await saveAndReply(from, bumpSession(session), getPaymentErrorMessage(validation.reason));
    return;
  }

  const redemption = await assessPaymentRedemption(validation.data, from);
  if (!redemption.allowed) {
    console.warn('Payment duplicate or incomplete:', {
      from,
      reason: redemption.reason,
      fingerprint: redemption.fingerprint,
      existingUserId: redemption.existingUserId,
    });
    await saveAndReply(from, bumpSession(session), getPaymentErrorMessage(redemption.reason));
    return;
  }

  const expiresAt = Date.now() + config.sessionDurationMs;
  const now = Date.now();
  const paymentData = {
    ...validation.data,
    fingerprint: redemption.fingerprint,
  };
  const updated = bumpSession(session, {
    state: SESSION_STATES.ACTIVE,
    expiresAt,
    paymentData,
    paymentReceivedAt: now,
    sessionStartedAt: now,
    messages: [{ role: 'assistant', content: MESSAGES.paymentConfirmed }],
  });

  await registerRedemption(redemption.fingerprint, from, paymentData);

  scheduleSessionEnd(from, config.sessionDurationMs, () => endSessionGracefully(from));
  await saveAndReply(from, updated, MESSAGES.paymentConfirmed);
}

async function handleActiveSession(from, text, session) {
  if (hasCompletedPayment(session) && !isPaidSessionActive(session)) {
    await saveAndReply(from, bumpSession(session), MESSAGES.paidSessionExpired);
    return;
  }

  if (Date.now() > session.expiresAt) {
    await endSessionGracefully(from);
    return;
  }

  if (!text) {
    await saveAndReply(from, session, MESSAGES.activeSessionPrompt);
    return;
  }

  if (wantsToEndSession(text)) {
    await endSessionGracefully(from);
    return;
  }

  const { reply, messages } = await generatePaidSessionReply(session, text);
  const updated = bumpSession(session, { messages });

  const minutesLeft = Math.round((session.expiresAt - Date.now()) / 60000);
  const suffix =
    minutesLeft <= config.sessionWarningMinutes ? sessionTimeWarning(minutesLeft) : '';

  await saveAndReply(from, updated, reply + suffix);
}

function stripMessageContext(content) {
  return String(content || '')
    .replace(/^\[Contexto numerológico[^\]]*\]\n\n/, '')
    .replace(/^\[Sesión pagada[^\]]*\]\n\n/, '');
}

function getLastUserMessage(session) {
  const msgs = session.messages || [];
  for (let i = msgs.length - 1; i >= 0; i -= 1) {
    if (msgs[i].role === 'user') {
      return stripMessageContext(msgs[i].content);
    }
  }
  return null;
}

async function generatePaidSessionReply(session, text) {
  let questionToAnswer = String(text || '').trim();

  if (isSessionScopeQuestion(questionToAnswer)) {
    const reply = buildPaidSessionScopeReply();
    return {
      reply,
      messages: [
        ...session.messages,
        { role: 'user', content: questionToAnswer },
        { role: 'assistant', content: reply },
      ],
    };
  }

  if (isQuestionChallenge(questionToAnswer)) {
    const priorQuestion = getLastUserMessage(session);
    if (priorQuestion) {
      if (isSessionScopeQuestion(priorQuestion)) {
        const reply = buildPaidSessionScopeReply();
        return {
          reply,
          messages: [
            ...session.messages,
            { role: 'user', content: questionToAnswer },
            { role: 'assistant', content: reply },
          ],
        };
      }
      questionToAnswer = priorQuestion;
    }
  }

  const contextPrefix = buildNumerologyContext(session);
  const userContent =
    '[Sesión pagada activa. Responde PRIMERO la pregunta literal del usuario. Desarrolla 3-5 oraciones con profundidad. Prohibido Yape, captura, S/ 4.90 o muro de cobro.]\n\n' +
    contextPrefix +
    questionToAnswer;

  const messages = [...session.messages, { role: 'user', content: userContent }];
  let reply = await chatWithGPT(messages, { temperature: 0.5 });

  if (isPaymentWallLikeReply(reply)) {
    const retryMessages = [
      ...messages,
      { role: 'assistant', content: reply },
      {
        role: 'user',
        content:
          'CORRECCIÓN: El pago ya fue recibido y la sesión está abierta. Reescribe tu respuesta: responde SOLO la pregunta del usuario sin mencionar Yape, Plin, captura, S/ 4.90 ni pedir abrir sesión.',
      },
    ];
    reply = await chatWithGPT(retryMessages, { temperature: 0.3 });
  }

  if (isPaymentWallLikeReply(reply)) {
    reply = buildPaidSessionFallbackReply(questionToAnswer, session.numerology);
  }

  return {
    reply,
    messages: [...messages, { role: 'assistant', content: reply }],
  };
}

function buildNumerologyContext(session) {
  if (!session.numerology) return '';

  const locationPart = session.location ? `, Ubicación: ${session.location}` : '';
  const timePart = session.birthTime ? `, Hora de nacimiento: ${session.birthTime}` : '';
  const astroPart = session.numerology.zodiacSign
    ? `, Signo: ${session.numerology.zodiacSign} (${session.numerology.zodiacElement || 'elemento'}), Vibración: ${session.numerology.temporalVibration || '—'}`
    : '';

  return (
    `[Contexto numerológico — Número de vida: ${session.numerology.lifePath}, ` +
    `Año personal: ${session.numerology.personalYear}, Color: ${session.numerology.color}${astroPart}, ` +
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
