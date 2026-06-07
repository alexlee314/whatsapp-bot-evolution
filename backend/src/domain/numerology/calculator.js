const { NUMBER_MEANINGS } = require('../../constants/numerologyData');

function sumDigits(value) {
  return String(value)
    .replace(/\D/g, '')
    .split('')
    .reduce((acc, d) => acc + Number(d), 0);
}

function reduceNumber(n) {
  let num = n;
  while (num > 9) {
    if (num === 11 || num === 22) return num;
    num = sumDigits(num);
  }
  return num;
}

function calculatePersonalYear(day, month) {
  const year = new Date().getFullYear();
  const monthPadded = String(month).padStart(2, '0');
  const total = sumDigits(day) + sumDigits(monthPadded) + sumDigits(year);
  return reduceNumber(total);
}

function calculateDayNumber(day, month) {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const birthMonth = String(month).padStart(2, '0');
  const total =
    sumDigits(day) + sumDigits(birthMonth) + sumDigits(currentDay) + sumDigits(currentMonth);
  return reduceNumber(total);
}

function getSignal1Key(lifePath, dayNumber) {
  if (lifePath === 11 || lifePath === 22) return lifePath;
  if (lifePath >= 1 && lifePath <= 9) return lifePath;
  if (dayNumber === 11 || dayNumber === 22) return dayNumber;
  return reduceNumber(dayNumber);
}

const { resolveZodiacSign } = require('../astrology/zodiac');

function calculateNumerology(day, month, year) {
  const dateDigits = `${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}`;
  const lifePathSum = dateDigits.split('').reduce((acc, d) => acc + Number(d), 0);
  const lifePath = reduceNumber(lifePathSum);

  const personalYear = calculatePersonalYear(day, month);
  const dayNumber = calculateDayNumber(day, month);
  const zodiac = resolveZodiacSign(day, month);

  const lifeProfile = NUMBER_MEANINGS[lifePath] || NUMBER_MEANINGS[reduceNumber(lifePath)];
  const dayProfile = NUMBER_MEANINGS[dayNumber] || NUMBER_MEANINGS[reduceNumber(dayNumber)];

  return {
    lifePath,
    personalYear,
    dayNumber,
    color: lifeProfile.color,
    numberMeaning: lifeProfile.meaning,
    dayColor: dayProfile.color,
    birthDateLabel: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
    zodiacSign: zodiac.sign,
    zodiacElement: zodiac.element,
    temporalVibration: zodiac.vibracion,
  };
}

module.exports = {
  calculateNumerology,
  calculatePersonalYear,
  calculateDayNumber,
  getSignal1Key,
  reduceNumber,
};
