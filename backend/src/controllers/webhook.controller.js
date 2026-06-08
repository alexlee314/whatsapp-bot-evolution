const { config } = require('../config/env');
const { withReplyCollector } = require('../lib/replyCollector');
const { withReplyFrom } = require('../lib/replyContext');
const { withUserLock } = require('../lib/messageLock');
const {
  isDuplicateMessageSid,
  isMessageSidInFlight,
  beginMessageSid,
  completeMessageSid,
  failMessageSid,
} = require('../lib/processedMessages');
const { parseTwilioWebhook } = require('../utils/webhookParser');
const { processIncomingMessage } = require('../services/conversationService');
const { beginTypingForUser, sendTextMessage } = require('../services/whatsappService');
const { MESSAGES } = require('../constants/messages');
const SessionModel = require('../models/SessionModel');
const WebhookView = require('../views/WebhookView');

async function buildTestResponse(incoming) {
  const { replies } = await withReplyCollector(() =>
    withReplyFrom(incoming.to, () =>
      withUserLock(incoming.from, () => processIncomingMessage(incoming))
    )
  );
  const session = await SessionModel.getSession(incoming.from);

  return WebhookView.toTestResponse({ incoming, replies, session });
}

async function handleWebhook(req, res) {
  const incoming = parseTwilioWebhook(req.body);

  if (!incoming) {
    return res.status(200).type('text/xml').send(WebhookView.toTwimlEmpty());
  }

  if (isDuplicateMessageSid(incoming.messageSid)) {
    console.log('Webhook duplicate skipped:', incoming.messageSid);
    return res.status(200).type('text/xml').send(WebhookView.toTwimlEmpty());
  }

  if (isMessageSidInFlight(incoming.messageSid)) {
    console.log('Webhook in-flight skipped:', incoming.messageSid);
    return res.status(200).type('text/xml').send(WebhookView.toTwimlEmpty());
  }

  console.log('Webhook received:', {
    from: incoming.from,
    to: incoming.to,
    text: incoming.text?.slice(0, 60) || '',
    sid: incoming.messageSid,
  });

  try {
    if (config.webhookReturnResponses) {
      const payload = await buildTestResponse(incoming);
      return res.json(payload);
    }

    res.status(200).type('text/xml').send(WebhookView.toTwimlEmpty());

    beginMessageSid(incoming.messageSid);

    beginTypingForUser(incoming.from, incoming.messageSid).catch(() => {});

    await withReplyFrom(incoming.to, () =>
      withUserLock(incoming.from, () => processIncomingMessage(incoming))
    );

    completeMessageSid(incoming.messageSid);
    console.log('Webhook processed:', incoming.messageSid);
  } catch (err) {
    failMessageSid(incoming.messageSid);
    console.error('Webhook processing error:', err.message);

    if (config.webhookReturnResponses) {
      return res.status(500).json(WebhookView.toError(err.message));
    }

    sendTextMessage(incoming.from, MESSAGES.openaiError).catch(() => {});
  }
}

module.exports = { handleWebhook };
