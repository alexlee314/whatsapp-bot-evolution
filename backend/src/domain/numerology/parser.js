const { SESSION_END_TRIGGERS } = require('../../constants/numerologyData');

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

module.exports = {
  parseBirthDate,
  buildBirthDateResult,
  parseRemainder,
  calculateAge,
  wantsToEndSession,
};
