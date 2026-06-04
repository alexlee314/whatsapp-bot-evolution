const { config } = require('../config/env');

function extractPassword(req) {
  return (
    req.headers['x-dashboard-password'] ||
    req.query.password ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '')
  );
}

function checkDashboardAuth(req, res, next) {
  const password = extractPassword(req);

  if (!password || password !== config.dashboardPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
}

module.exports = { checkDashboardAuth, extractPassword };
