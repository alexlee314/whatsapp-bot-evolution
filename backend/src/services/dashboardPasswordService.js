const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { config } = require('../config/env');

const AUTH_FILE = path.join(__dirname, '../../data/dashboard-auth.json');
const MIN_PASSWORD_LENGTH = 8;

let cachedAuth = null;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash: derived };
}

function readAuthFile() {
  if (!fs.existsSync(AUTH_FILE)) return null;
  return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
}

function writeAuthFile(record) {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(record, null, 2), 'utf8');
  cachedAuth = record;
}

function verifyHash(password, record) {
  if (!record?.salt || !record?.hash) return false;
  const { hash } = hashPassword(password, record.salt);
  const expected = Buffer.from(record.hash, 'hex');
  const actual = Buffer.from(hash, 'hex');
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

function ensureInitialized() {
  if (cachedAuth) return cachedAuth;

  const existing = readAuthFile();
  if (existing?.salt && existing?.hash) {
    cachedAuth = existing;
    return cachedAuth;
  }

  const initial = config.dashboardPassword || 'admin123';
  const record = {
    ...hashPassword(initial),
    updatedAt: new Date().toISOString(),
    initializedFrom: 'env-default',
  };
  writeAuthFile(record);
  console.log('Dashboard password initialized (default: admin123 — change it in the panel settings)');
  return record;
}

function verifyPassword(password) {
  const record = ensureInitialized();
  return verifyHash(password, record);
}

function validateNewPassword(newPassword) {
  const value = String(newPassword || '');
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
}

function changePassword(currentPassword, newPassword) {
  ensureInitialized();

  if (!verifyPassword(currentPassword)) {
    return { ok: false, error: 'Contraseña actual incorrecta.' };
  }

  const validationError = validateNewPassword(newPassword);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (currentPassword === newPassword) {
    return { ok: false, error: 'La nueva contraseña debe ser distinta a la actual.' };
  }

  const record = {
    ...hashPassword(newPassword),
    updatedAt: new Date().toISOString(),
  };
  writeAuthFile(record);
  return { ok: true };
}

module.exports = {
  verifyPassword,
  changePassword,
  validateNewPassword,
  MIN_PASSWORD_LENGTH,
  ensureInitialized,
};
