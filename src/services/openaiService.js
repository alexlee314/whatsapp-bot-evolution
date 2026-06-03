const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a helpful, friendly assistant. 
You are in a WhatsApp conversation helping the user with their request.
Keep responses concise and clear — this is a chat interface, not an essay.
You have been activated after the user confirmed their payment.`;

async function chatWithGPT(messageHistory) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messageHistory,
      ],
    });

    return response.choices[0].message.content;

  } catch (err) {
    console.error('OpenAI error:', err.message);
    return "Sorry, I'm having trouble responding right now. Please try again in a moment.";
  }
}

module.exports = { chatWithGPT };
