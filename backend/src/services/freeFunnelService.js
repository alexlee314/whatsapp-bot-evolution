const { openai } = require('../lib/clients/openai.client');
const { config } = require('../config/env');
const { SESSION_STATES } = require('../config/constants');
const {
  buildConversationalFunnelReply,
  buildFreeFunnelChatPrompt,
  buildFirstFreeSignalMessage,
  buildSecondFreeSignalMessage,
  buildUserClarificationReply,
  buildReassuranceFunnelReply,
  isReassuranceQuestion,
  needsUserClarification,
  isExplanationRequest,
  isUncertaintyMessage,
  isShortAmbiguousMessage,
  isDeclineMessage,
} = require('./oanBrainService');

const HOOK_MARKERS = [
  'cargando con un peso que no te corresponde',
  'giro importante en tu entorno',
  'tu mente está dándole demasiadas vueltas',
  'parar un ratito la máquina',
  'tus números confirman que este tema',
  'tus fuentes andinas marcan',
];

const ORACLE_WELCOME_COUNT = 1;
const PAYMENT_WALL_ORACLE_MESSAGE = 4;

function countOracleMessagesSent(session) {
  const funnelAssistant = (session.funnelMessages || []).filter(
    (message) => message.role === 'assistant'
  ).length;
  return ORACLE_WELCOME_COUNT + funnelAssistant;
}

function shouldShowPaymentWall(session) {
  if (session.paymentReceivedAt || session.paymentData) return false;
  if (session.state === SESSION_STATES.AWAITING_PAYMENT) return false;
  if (session.state === SESSION_STATES.ACTIVE) return false;
  return countOracleMessagesSent(session) >= PAYMENT_WALL_ORACLE_MESSAGE - 1;
}

function isGenericHookReply(text) {
  const normalized = String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  return HOOK_MARKERS.some((marker) =>
    normalized.includes(
      marker
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
    )
  );
}

function userTurnsInCurrentFunnelStep(session) {
  const messages = session.funnelMessages || [];

  if (session.state === SESSION_STATES.AWAITING_FREE_SIGNAL_2) {
    return messages.filter((message) => message.role === 'user').length;
  }

  if (
    session.state === SESSION_STATES.AWAITING_FREE_SIGNAL_3 ||
    session.state === SESSION_STATES.AWAITING_HOOK_RESPONSE
  ) {
    let secondSignalIndex = -1;
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].role === 'assistant' && /El color \*/.test(messages[index].content)) {
        secondSignalIndex = index;
        break;
      }
    }

    if (secondSignalIndex === -1) {
      return messages.filter((message) => message.role === 'user').length;
    }

    return messages
      .slice(secondSignalIndex + 1)
      .filter((message) => message.role === 'user').length;
  }

  return 0;
}

function getLastAssistantMessage(session) {
  const messages = session.funnelMessages || [];
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'assistant') {
      return messages[index].content;
    }
  }
  return '';
}

function ensureFunnelContext(session, step) {
  if (session.funnelMessages?.length) return session;
  if (!session.numerology) return session;

  const seed =
    step === 'after_first_signal'
      ? buildFirstFreeSignalMessage(session.numerology)
      : buildSecondFreeSignalMessage(session.numerology);

  return { ...session, funnelMessages: [{ role: 'assistant', content: seed }] };
}

function buildFunnelHistory(session, userText, assistantText) {
  return [
    ...(session.funnelMessages || []),
    { role: 'user', content: userText },
    { role: 'assistant', content: assistantText },
  ];
}

function buildTemplateReply(session, text, step) {
  const contextualSession = ensureFunnelContext(session, step);

  return buildConversationalFunnelReply({
    step,
    numerology: contextualSession.numerology,
    userText: text,
    turnIndex: userTurnsInCurrentFunnelStep(contextualSession),
    lastBotMessage: getLastAssistantMessage(contextualSession),
  });
}

async function generateGptFunnelReply(session, text, step) {
  const contextualSession = ensureFunnelContext(session, step);
  const history = (contextualSession.funnelMessages || []).slice(-10);
  const systemPrompt = buildFreeFunnelChatPrompt(step, contextualSession.numerology);

  const response = await openai.chat.completions.create({
    model: config.openaiChatModel,
    max_tokens: config.funnelChatMaxTokens,
    temperature: 0.75,
    messages: [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: text }],
  });

  const reply = response.choices[0]?.message?.content?.trim();
  if (!reply || isGenericHookReply(reply)) {
    throw new Error('Generic or empty GPT funnel reply');
  }

  return reply;
}

async function replyInFunnelStep(session, text, step) {
  if (needsUserClarification(text)) {
    return buildUserClarificationReply(text);
  }

  if (isReassuranceQuestion(text)) {
    return buildReassuranceFunnelReply(session.numerology, text);
  }

  const useGpt = config.freeFunnelUseGpt && Boolean(config.openaiApiKey);

  if (useGpt) {
    try {
      return await generateGptFunnelReply(session, text, step);
    } catch (err) {
      console.error('Free funnel GPT fallback:', err.message);
    }
  }

  return buildTemplateReply(session, text, step);
}

async function replyAfterFirstSignal(session, text) {
  return replyInFunnelStep(session, text, 'after_first_signal');
}

async function replyAfterSecondSignal(session, text) {
  return replyInFunnelStep(session, text, 'after_second_signal');
}

module.exports = {
  countOracleMessagesSent,
  shouldShowPaymentWall,
  userTurnsInCurrentFunnelStep,
  replyAfterFirstSignal,
  buildFunnelHistory,
  ensureFunnelContext,
};
