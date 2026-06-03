require('dotenv').config();
const express = require('express');
const { handleIncomingMessage } = require('./handlers/messageHandler');
const { dashboardRouter } = require('../dashboard/routes');

const app = express();
app.use(express.json());

// Evolution API webhook
app.post('/webhook', handleIncomingMessage);

// Dashboard
app.use('/dashboard', dashboardRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
