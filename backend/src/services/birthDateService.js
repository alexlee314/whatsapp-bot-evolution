const { openai } = require('../lib/clients/openai.client');
const { config } = require('../config/env');
const {
  parseBirthDateLocal,
  buildBirthDateResult,
  looksLikeBirthDateAttempt,
} = require('../domain/numerology/parser');

const BIRTH_DATE_EXTRACTION_PROMPT = `Extract birth date from the user message only. JSON only:
{"success":true|false,"day":1-31,"month":1-12,"year":4-digit,"timeOfBirth":string|null,"location":string|null}
Use null when unknown. Convert month names to numbers.
Do NOT search the internet or use external knowledge. Do NOT interpret numerology. Only parse the date fields.`;

async function extractBirthDateWithGPT(text) {
  try {
    const response = await openai.chat.completions.create({
      model: config.openaiBirthDateModel,
      max_tokens: 80,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: BIRTH_DATE_EXTRACTION_PROMPT },
        { role: 'user', content: text },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed.success) return null;

    return buildBirthDateResult(
      Number(parsed.day),
      Number(parsed.month),
      Number(parsed.year),
      {
        timeOfBirth: parsed.timeOfBirth || null,
        location: parsed.location || null,
      }
    );
  } catch (err) {
    console.error('Birth date GPT extraction error:', err.message);
    return null;
  }
}

async function parseBirthDateFlexible(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const local = parseBirthDateLocal(trimmed);
  if (local) return local;

  if (!looksLikeBirthDateAttempt(trimmed)) return null;

  return extractBirthDateWithGPT(trimmed);
}

module.exports = {
  BIRTH_DATE_EXTRACTION_PROMPT,
  extractBirthDateWithGPT,
  parseBirthDateFlexible,
};
