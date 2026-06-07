const fs = require('fs');
const path = require('path');

const ASTRO_DICT_PATH = path.join(__dirname, '../../../data/diccionarioastrologico.json');

let cachedRanges = null;

function loadSignRanges() {
  if (cachedRanges) return cachedRanges;

  const raw = JSON.parse(fs.readFileSync(ASTRO_DICT_PATH, 'utf8'));
  cachedRanges = raw.diccionario_limpieza_oraculo?.mapeo_signos_por_rango_interno || {};
  return cachedRanges;
}

function parseMonthDay(value) {
  const [month, day] = String(value || '').split('-').map(Number);
  return { month, day };
}

function dayOfYear(month, day) {
  return month * 100 + day;
}

function resolveZodiacSign(day, month) {
  const ranges = loadSignRanges();
  const target = dayOfYear(month, day);

  for (const [sign, config] of Object.entries(ranges)) {
    const start = parseMonthDay(config.inicio);
    const end = parseMonthDay(config.fin);
    const startValue = dayOfYear(start.month, start.day);
    const endValue = dayOfYear(end.month, end.day);

    if (startValue <= endValue) {
      if (target >= startValue && target <= endValue) {
        return { sign, element: config.elemento, vibracion: config.vibracion };
      }
      continue;
    }

    if (target >= startValue || target <= endValue) {
      return { sign, element: config.elemento, vibracion: config.vibracion };
    }
  }

  return { sign: null, element: null, vibracion: null };
}

module.exports = { resolveZodiacSign, loadSignRanges, ASTRO_DICT_PATH };
