const express = require('express');
const webhookRoutes = require('./routes/webhook.routes');
const healthRoutes = require('./routes/health.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

function createApp() {
  const app = express();

  // Twilio sends webhooks as application/x-www-form-urlencoded
  app.use('/webhook', express.urlencoded({ extended: false }));
  app.use(express.json());

  app.use('/health', healthRoutes);
  app.use('/webhook', webhookRoutes);
  app.use('/dashboard', dashboardRoutes);

  return app;
}

module.exports = { createApp };
