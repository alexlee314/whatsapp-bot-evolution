const { config } = require('../config/env');
const { openai } = require('../lib/clients/openai.client');
const { buildPaidSessionSystemPrompt } = require('./oanBrainService');
const { MESSAGES } = require('../constants/messages');

async function chatWithGPT(messageHistory, options = {}) {
  try {
    const response = await openai.chat.completions.create({
      model: config.openaiChatModel,
      max_tokens: options.maxTokens || config.paidChatMaxTokens,
      temperature: options.temperature ?? 0.5,
      messages: [
        { role: 'system', content: buildPaidSessionSystemPrompt() },
        ...messageHistory,
      ],
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error('OpenAI error:', err.message);
    return MESSAGES.openaiError;
  }
}

module.exports = { chatWithGPT };
