const { Pool } = require('pg');
const { config } = require('../config/env');

let pool = null;

function getPool() {
  if (!pool) {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL is required for PostgreSQL session store');
    }
    pool = new Pool({ connectionString: config.databaseUrl });
  }
  return pool;
}

async function connectDb() {
  const client = await getPool().connect();
  client.release();
}

async function disconnectDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, connectDb, disconnectDb };
