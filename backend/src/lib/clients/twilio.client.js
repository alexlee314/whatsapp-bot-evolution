const twilio = require('twilio');
const { config } = require('../../config/env');

let client = null;

function getTwilioClient() {
  if (!client) {
    client = twilio(config.twilio.accountSid, config.twilio.authToken);
  }
  return client;
}

function getWhatsAppFrom() {
  return config.twilio.whatsappFrom;
}

module.exports = { getTwilioClient, getWhatsAppFrom };
