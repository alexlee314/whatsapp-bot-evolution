const { config } = require('./config/env');
const { createApp } = require('./app');
const { restoreActiveSessionTimers, getStorePath } = require('./models/SessionModel');
const { endSessionGracefully } = require('./services/conversationService');

restoreActiveSessionTimers(endSessionGracefully);

const app = createApp();
const { port } = config;

const server = app.listen(port, () => {
  console.log(`Bot running on port ${port}`);
  console.log(`Sessions store: ${getStorePath()}`);
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

module.exports = app;
