const { openai } = require('../lib/clients/openai.client');
const { buildPaidSessionSystemPrompt } = require('./knowledgeService');
const { MESSAGES } = require('../constants/messages');

async function chatWithGPT(messageHistory, options = {}) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: options.maxTokens || 300,
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
