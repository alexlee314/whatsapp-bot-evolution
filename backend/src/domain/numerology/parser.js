const { SESSION_END_TRIGGERS } = require('../../constants/numerologyData');

function parseBirthDate(text) {
  const trimmed = text.trim();

  const patterns = [
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/,
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (!match) continue;

    let day = Number(match[1]);
    let month = Number(match[2]);
    let year = Number(match[3]);

    if (year < 100) year += year >= 50 ? 1900 : 2000;

    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      continue;
    }

    const location = trimmed.replace(match[0], '').replace(/^[,.\s-]+/, '').trim();
    return { day, month, year, location: location || null };
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

module.exports = { parseBirthDate, calculateAge, wantsToEndSession };
