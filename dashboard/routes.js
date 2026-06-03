const express = require('express');
const path = require('path');
const { getAllSessions } = require('../src/services/sessionService');

const dashboardRouter = express.Router();

// Serve dashboard UI
dashboardRouter.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for live data
dashboardRouter.get('/api/sessions', async (req, res) => {
  const sessions = await getAllSessions();

  const data = sessions.map(s => ({
    userId: s.userId.replace('whatsapp:', ''),
    state: s.state,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    timeLeft: s.expiresAt ? Math.max(0, Math.round((s.expiresAt - Date.now()) / 60000)) : null,
    paymentAmount: s.paymentData?.amount || null,
    paymentCurrency: s.paymentData?.currency || null,
    paymentDate: s.paymentData?.date || null,
    messageCount: s.messages?.length || 0,
  }));

  res.json(data);
});

module.exports = { dashboardRouter };
