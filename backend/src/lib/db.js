const { Pool } = require('pg');
const { config } = require('../config/env');
const { withTimeout } = require('./withTimeout');

let pool = null;

const DEFAULT_QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS) || 6000;

function isCloudPostgres(connectionString) {
  return (
    connectionString.includes('supabase.co') ||
    connectionString.includes('pooler.supabase.com') ||
    connectionString.includes('sslmode=require') ||
    connectionString.includes('ssl=true')
  );
}

function buildPoolConfig() {
  const connectionString = config.databaseUrl;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for PostgreSQL session store');
  }

  const options = {
    connectionString,
    max: 10,
    min: 0,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
  };

  if (isCloudPostgres(connectionString)) {
    options.ssl = { rejectUnauthorized: false };
  }

  return options;
}

function getPool() {
  if (!pool) {
    pool = new Pool(buildPoolConfig());
    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err.message);
    });
  }
  return pool;
}

async function connectDb() {
  const client = await getPool().connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}

async function disconnectDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

async function queryWithTimeout(text, params, timeoutMs = DEFAULT_QUERY_TIMEOUT_MS) {
  return withTimeout(getPool().query(text, params), timeoutMs, 'PostgreSQL query');
}

module.exports = { getPool, connectDb, disconnectDb, isCloudPostgres, queryWithTimeout, DEFAULT_QUERY_TIMEOUT_MS };
