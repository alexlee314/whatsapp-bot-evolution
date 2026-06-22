const express = require('express');
const path = require('path');
const {
  serveDashboardPage,
  getDashboardJson,
  changeDashboardPassword,
} = require('../controllers/dashboard.controller');
const { checkDashboardAuth } = require('../middleware/dashboardAuth');

const router = express.Router();
const frontendDir = path.join(__dirname, '../../../frontend/public');

router.use('/assets', express.static(path.join(frontendDir, 'assets')));
router.get('/', serveDashboardPage);
router.get('/data', checkDashboardAuth, getDashboardJson);
router.post('/password', express.json(), checkDashboardAuth, changeDashboardPassword);

module.exports = router;
