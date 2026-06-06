const { config } = require('../config/env');
const { withReplyCollector } = require('../lib/replyCollector');
const { withUserLock } = require('../lib/messageLock');
const { isDuplicateMessageSid } = require('../lib/processedMessages');
const { parseTwilioWebhook } = require('../utils/webhookParser');
const { processIncomingMessage } = require('../services/conversationService');
const { beginTypingForUser } = require('../services/whatsappService');
const SessionModel = require('../models/SessionModel');
const WebhookView = require('../views/WebhookView');

async function buildTestResponse(incoming) {
  const { replies } = await withReplyCollector(() =>
    withUserLock(incoming.from, () => processIncomingMessage(incoming))
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
    return res.status(200).type('text/xml').send(WebhookView.toTwimlEmpty());
  }

  try {
    if (config.webhookReturnResponses) {
      const payload = await buildTestResponse(incoming);
      return res.json(payload);
    }

    res.status(200).type('text/xml').send(WebhookView.toTwimlEmpty());
    await beginTypingForUser(incoming.from, incoming.messageSid);
    await withUserLock(incoming.from, () => processIncomingMessage(incoming));
  } catch (err) {
    console.error('Webhook processing error:', err.message);

    if (config.webhookReturnResponses) {
      return res.status(500).json(WebhookView.toError(err.message));
    }
  }
}

module.exports = { handleWebhook };
