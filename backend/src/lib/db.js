const { Pool } = require('pg');
const { config } = require('../config/env');

let pool = null;

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
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
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

module.exports = { getPool, connectDb, disconnectDb, isCloudPostgres };
