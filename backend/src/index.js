const { config } = require('./config/env');
const { createApp } = require('./app');
const { connectDb } = require('./lib/db');
const { runMigrations } = require('./lib/migrate');
const { resolveStoreKind } = require('./lib/sessionStore');
const {
  restoreActiveSessionTimers,
  startSessionExpiryWorker,
  getStorePath,
} = require('./models/SessionModel');
const { endSessionGracefully } = require('./services/conversationService');

async function startServer() {
  const storeKind = resolveStoreKind();

  if (storeKind === 'postgres') {
    if (!config.databaseUrl) {
      throw new Error('SESSION_STORE=postgres requires DATABASE_URL in .env');
    }
    await connectDb();
    await runMigrations();
    console.log('PostgreSQL connected');
  }

  await restoreActiveSessionTimers(endSessionGracefully);
  startSessionExpiryWorker(endSessionGracefully);

  const app = createApp();
  const { port } = config;

  const server = app.listen(port, () => {
    console.log(`Bot running on port ${port}`);
    console.log(`Session store: ${storeKind} (${getStorePath()})`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${port} is already in use. Stop the other process (netstat -ano | findstr :${port}) or set PORT in .env.`
      );
      process.exit(1);
    }
    throw err;
  });

  return app;
}

startServer().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

module.exports = { startServer };
