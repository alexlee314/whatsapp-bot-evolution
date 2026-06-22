const { verifyPassword } = require('../services/dashboardPasswordService');

function extractPassword(req) {
  return (
    req.headers['x-dashboard-password'] ||
    req.query.password ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '')
  );
}

async function checkDashboardAuth(req, res, next) {
  const password = extractPassword(req);

  if (!password) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const valid = verifyPassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.dashboardPassword = password;
    return next();
  } catch (err) {
    console.error('Dashboard auth error:', err.message);
    return res.status(500).json({ error: 'Auth check failed' });
  }
}

module.exports = { checkDashboardAuth, extractPassword };
