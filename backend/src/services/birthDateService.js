const { openai } = require('../lib/clients/openai.client');
const {
  parseBirthDate,
  buildBirthDateResult,
  parseRemainder,
} = require('../domain/numerology/parser');

const BIRTH_DATE_EXTRACTION_PROMPT = `You extract birth information from user messages in any language or format.

The user may write dates in many ways, for example:
- "14/02/1995, Lima"
- "4 of may 1980"
- "4 de mayo de 1980"
- "4 de mayo 1980, 3pm, Lima"
- "4 of may 1980 born at noon in Cusco"
- "naci el 15 de enero del 92 en Arequipa a las 8 de la noche"

Extract ONLY what is explicitly stated. Do not invent or guess missing data.

Respond with valid JSON only, no markdown or extra text:
{
  "success": true or false,
  "day": number 1-31 or null,
  "month": number 1-12 or null,
  "year": number with 4 digits or null,
  "timeOfBirth": string as the user wrote it (e.g. "3pm", "15:00", "noon", "mediodía", "8 de la noche") or null,
  "location": city, district or place name or null
}

If no valid calendar birth date can be determined, set success to false and all other fields to null.
Month names in English, Spanish or other languages must be converted to numeric month 1-12.
Two-digit years: assume 19xx for 50-99 and 20xx for 00-49.`;

async function extractBirthDateWithGPT(text) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 150,
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

  const regexResult = parseBirthDate(trimmed);
  if (regexResult) {
    const { timeOfBirth, location } = parseRemainder(regexResult.remainder);
    return {
      day: regexResult.day,
      month: regexResult.month,
      year: regexResult.year,
      timeOfBirth: timeOfBirth || null,
      location: location || regexResult.location || null,
    };
  }

  return extractBirthDateWithGPT(trimmed);
}

module.exports = {
  BIRTH_DATE_EXTRACTION_PROMPT,
  extractBirthDateWithGPT,
  parseBirthDateFlexible,
};
