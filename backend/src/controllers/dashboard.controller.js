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

async function changeDashboardPassword(req, res) {
  const { newPassword, confirmPassword } = req.body || {};
  const { changePassword, MIN_PASSWORD_LENGTH } = require('../services/dashboardPasswordService');

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({
      error: 'Completa la nueva contraseña y su confirmación.',
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'La confirmación no coincide.' });
  }

  const result = changePassword(req.dashboardPassword, newPassword);

  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    ok: true,
    message: 'Contraseña actualizada. Usa la nueva clave la próxima vez que entres.',
    minLength: MIN_PASSWORD_LENGTH,
  });
}

module.exports = { serveDashboardPage, getDashboardJson, changeDashboardPassword };
