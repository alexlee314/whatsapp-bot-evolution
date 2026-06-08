const { SESSION_END_TRIGGERS } = require('../../constants/numerologyData');
const { loadMonthMapFromDictionary } = require('../astrology/birthDateDictionary');

const MONTH_BY_NAME = {
  enero: 1,
  january: 1,
  jan: 1,
  febrero: 2,
  february: 2,
  feb: 2,
  marzo: 3,
  march: 3,
  mar: 3,
  abril: 4,
  april: 4,
  apr: 4,
  mayo: 5,
  may: 5,
  junio: 6,
  june: 6,
  jun: 6,
  julio: 7,
  july: 7,
  jul: 7,
  agosto: 8,
  august: 8,
  aug: 8,
  septiembre: 9,
  september: 9,
  sep: 9,
  sept: 9,
  octubre: 10,
  october: 10,
  oct: 10,
  noviembre: 11,
  november: 11,
  nov: 11,
  diciembre: 12,
  december: 12,
  dec: 12,
  ...loadMonthMapFromDictionary(),
};

const MONTH_NAME_PATTERN = Object.keys(MONTH_BY_NAME).join('|');

function isValidDate(day, month, year) {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function normalizeYear(year) {
  if (year < 100) return year >= 50 ? 1900 + year : 2000 + year;
  return year;
}

function buildBirthDateResult(day, month, year, extras = {}) {
  const normalizedYear = normalizeYear(Number(year));
  const normalizedDay = Number(day);
  const normalizedMonth = Number(month);

  if (
    !Number.isFinite(normalizedDay) ||
    !Number.isFinite(normalizedMonth) ||
    !Number.isFinite(normalizedYear)
  ) {
    return null;
  }

  if (!isValidDate(normalizedDay, normalizedMonth, normalizedYear)) {
    return null;
  }

  return {
    day: normalizedDay,
    month: normalizedMonth,
    year: normalizedYear,
    location: extras.location || null,
    timeOfBirth: extras.timeOfBirth || null,
  };
}

function parseRemainder(remainder) {
  if (!remainder) return { timeOfBirth: null, location: null };

  let location = remainder.trim();
  let timeOfBirth = null;

  const timePatterns = [
    /\b(noon|mediod[ií]a|midnight|medianoche)\b/i,
    /\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?)\b/i,
    /\b(\d{1,2}\s*(?:am|pm|a\.m\.|p\.m\.))\b/i,
    /\b(?:a las|at|born at|naci[oó]\s+a las?)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?|noon|mediod[ií]a)\b/i,
  ];

  for (const pattern of timePatterns) {
    const match = location.match(pattern);
    if (!match) continue;

    timeOfBirth = match[1] || match[0];
    location = location.replace(match[0], '').trim();
    break;
  }

  location = location
    .replace(/^(?:in|en|de|from)\s+/i, '')
    .replace(/^[,.\s-]+|[,\s-]+$/g, '')
    .trim();

  return { timeOfBirth, location: location || null };
}

function parseBirthDate(text) {
  const trimmed = text.trim();

  const patterns = [
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/,
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (!match) continue;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = normalizeYear(Number(match[3]));

    if (!isValidDate(day, month, year)) continue;

    const remainder = trimmed.replace(match[0], '').replace(/^[,.\s-]+/, '').trim();
    const { location } = parseRemainder(remainder);

    return { day, month, year, location: location || null, remainder };
  }

  return null;
}

function parseNaturalLanguageBirthDate(text) {
  const trimmed = text.trim();
  const monthRe = new RegExp(
    `(\\d{1,2})\\s+(?:de\\s+|del\\s+|of\\s+)?(${MONTH_NAME_PATTERN})\\s+(?:de\\s+|del\\s+|of\\s+)?(\\d{2,4})`,
    'i'
  );
  const match = trimmed.match(monthRe);
  if (!match) return null;

  const day = Number(match[1]);
  const month = MONTH_BY_NAME[match[2].toLowerCase()];
  const year = normalizeYear(Number(match[3]));
  if (!month || !isValidDate(day, month, year)) return null;

  const remainder = trimmed.replace(match[0], '').replace(/^[,.\s-]+|[,\s-]+$/g, '').trim();
  const { timeOfBirth, location } = parseRemainder(remainder);

  return { day, month, year, location: location || null, timeOfBirth: timeOfBirth || null, remainder };
}

function parseBirthDateLocal(text) {
  const numeric = parseBirthDate(text);
  if (numeric) {
    const { timeOfBirth, location } = parseRemainder(numeric.remainder);
    return {
      day: numeric.day,
      month: numeric.month,
      year: numeric.year,
      timeOfBirth: timeOfBirth || null,
      location: location || numeric.location || null,
    };
  }

  const natural = parseNaturalLanguageBirthDate(text);
  if (natural) {
    return {
      day: natural.day,
      month: natural.month,
      year: natural.year,
      timeOfBirth: natural.timeOfBirth || null,
      location: natural.location || null,
    };
  }

  return null;
}

function calculateAge(day, month, year) {
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;
  const dayDiff = today.getDate() - day;

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

function wantsToEndSession(text) {
  const lower = text.toLowerCase();
  return SESSION_END_TRIGGERS.some((trigger) => lower.includes(trigger));
}

const GREETING_PATTERN =
  /^(?:hola|hi|hello|hey|buenas|buenos dias|buenas tardes|buenas noches|saludos|ola|good morning|good afternoon|good evening)[\s!.?]*$/i;

const CLARIFICATION_PATTERN =
  /no me la pediste|no me la (?:has )?pedido|(?:que|qué) fecha|para qu[eé]|por qu[eé]|what date|didn['']t ask/i;

function isCasualGreeting(text) {
  return GREETING_PATTERN.test(String(text || '').trim());
}

function isBirthDateClarificationQuestion(text) {
  return CLARIFICATION_PATTERN.test(String(text || '').trim());
}

function looksLikeBirthDateAttempt(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  if (/\d/.test(value)) return true;
  return new RegExp(MONTH_NAME_PATTERN, 'i').test(value);
}

module.exports = {
  parseBirthDate,
  parseBirthDateLocal,
  buildBirthDateResult,
  parseRemainder,
  calculateAge,
  wantsToEndSession,
  isCasualGreeting,
  isBirthDateClarificationQuestion,
  looksLikeBirthDateAttempt,
};
