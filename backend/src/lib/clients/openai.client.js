const OpenAI = require('openai');
const { config } = require('../../config/env');

const openai = new OpenAI({ apiKey: config.openaiApiKey });

module.exports = { openai };
