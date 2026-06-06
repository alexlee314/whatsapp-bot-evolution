require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const config = {
  port: Number(process.env.PORT) || 3000,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBirthDateModel: process.env.OPENAI_BIRTH_DATE_MODEL || 'gpt-4o-mini',
  openaiChatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o',
  freeFunnelUseGpt: process.env.FREE_FUNNEL_USE_GPT !== 'false',
  dashboardPassword: process.env.DASHBOARD_PASSWORD || 'admin123',
  webhookReturnResponses: process.env.WEBHOOK_RETURN_RESPONSES === 'true',
  databaseUrl: process.env.DATABASE_URL || null,
  sessionStore: (process.env.SESSION_STORE || 'auto').toLowerCase(),
  databasePath: process.env.DATABASE_PATH || null,
  twilioTypingIndicator: process.env.TWILIO_TYPING_INDICATOR !== 'false',
  /** Paid session length after Yape validation (default 1 hour). Use e.g. 120000 for 2-minute tests. */
  sessionDurationMs:
    Number(process.env.SESSION_DURATION_MS) > 0
      ? Number(process.env.SESSION_DURATION_MS)
      : 60 * 60 * 1000,
  sessionWarningMinutes:
    Number(process.env.SESSION_WARNING_MINUTES) >= 0
      ? Number(process.env.SESSION_WARNING_MINUTES)
      : 10,
  /** Max GPT tokens for paid session replies */
  paidChatMaxTokens:
    Number(process.env.OPENAI_PAID_CHAT_MAX_TOKENS) > 0
      ? Number(process.env.OPENAI_PAID_CHAT_MAX_TOKENS)
      : 550,
  /** Max GPT tokens for free funnel replies */
  funnelChatMaxTokens:
    Number(process.env.OPENAI_FUNNEL_MAX_TOKENS) > 0
      ? Number(process.env.OPENAI_FUNNEL_MAX_TOKENS)
      : 380,
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
