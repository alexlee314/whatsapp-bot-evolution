const { getWhatsAppFrom } = require('./clients/twilio.client');

let activeReplyFrom = null;

function withReplyFrom(twilioWhatsAppFrom, fn) {
  activeReplyFrom = twilioWhatsAppFrom || null;
  return Promise.resolve(fn()).finally(() => {
    activeReplyFrom = null;
  });
}

function getActiveReplyFrom() {
  return activeReplyFrom || getWhatsAppFrom();
}

module.exports = { withReplyFrom, getActiveReplyFrom };
