const fs = require('fs');
const path = require('path');

const ASTRO_DICT_PATH = path.join(__dirname, '../../../data/diccionarioastrologico.json');

let cachedMonthMap = null;

function loadMonthMapFromDictionary() {
  if (cachedMonthMap) return cachedMonthMap;

  const raw = JSON.parse(fs.readFileSync(ASTRO_DICT_PATH, 'utf8'));
  const source = raw.diccionario_limpieza_oraculo?.mapeo_meses_naturales || {};
  const map = {};

  for (const [key, value] of Object.entries(source)) {
    const month = Number(String(value).replace(/^0+/, '') || value);
    if (!Number.isFinite(month) || month < 1 || month > 12) continue;
    map[String(key).toLowerCase()] = month;
  }

  cachedMonthMap = map;
  return map;
}

module.exports = { loadMonthMapFromDictionary, ASTRO_DICT_PATH };
