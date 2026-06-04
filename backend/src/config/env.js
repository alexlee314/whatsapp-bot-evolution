require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const config = {
  port: Number(process.env.PORT) || 3000,
  openaiApiKey: process.env.OPENAI_API_KEY,
  dashboardPassword: process.env.DASHBOARD_PASSWORD || 'admin123',
  webhookReturnResponses: process.env.WEBHOOK_RETURN_RESPONSES === 'true',
  databasePath: process.env.DATABASE_PATH || null,
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM,
  },
};

function isTwilioConfigured() {
  const { accountSid, authToken, whatsappFrom } = config.twilio;
  return (
    Boolean(accountSid) &&
    accountSid !== 'your_twilio_account_sid_here' &&
    Boolean(authToken) &&
    authToken !== 'your_twilio_auth_token_here' &&
    Boolean(whatsappFrom) &&
    whatsappFrom !== 'whatsapp:+00000000000'
  );
}

module.exports = { config, isTwilioConfigured };
