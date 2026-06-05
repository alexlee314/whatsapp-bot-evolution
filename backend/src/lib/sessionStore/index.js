const { config } = require('../../config/env');
const jsonStore = require('./jsonSessionStore');
const postgresStore = require('./postgresSessionStore');

function resolveStoreKind() {
  if (config.sessionStore === 'json') return 'json';
  if (config.sessionStore === 'postgres') return 'postgres';
  return config.databaseUrl ? 'postgres' : 'json';
}

function getStore() {
  return resolveStoreKind() === 'postgres' ? postgresStore : jsonStore;
}

function isPostgresStore() {
  return resolveStoreKind() === 'postgres';
}

module.exports = {
  getStore,
  isPostgresStore,
  resolveStoreKind,
};
