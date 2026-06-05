const { config } = require('../../config/env');
const jsonStore = require('./jsonSessionStore');
const postgresStore = require('./postgresSessionStore');

function resolveStoreKind() {
  const store = config.sessionStore;
  if (store === 'json') return 'json';
  if (store === 'postgres' || store === 'postgresql') return 'postgres';
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
