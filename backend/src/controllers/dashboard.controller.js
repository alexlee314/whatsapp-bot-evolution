const path = require('path');
const DashboardModel = require('../models/DashboardModel');
const DashboardView = require('../views/DashboardView');

const frontendDir = path.join(__dirname, '../../../frontend/public');

function serveDashboardPage(req, res) {
  res.sendFile(path.join(frontendDir, 'index.html'));
}

async function getDashboardJson(req, res) {
  try {
    const data = await DashboardModel.getDashboardData();
    res.json(DashboardView.toJson(data));
  } catch (err) {
    console.error('Dashboard data error:', err.message);
    res.status(500).json(DashboardView.toError('Failed to load dashboard data'));
  }
}

module.exports = { serveDashboardPage, getDashboardJson };
