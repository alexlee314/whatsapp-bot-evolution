import { REFRESH_MS } from './utils/config.js';
import { init, refresh, startAutoRefresh } from './controllers/DashboardController.js';

init();
startAutoRefresh(REFRESH_MS, refresh);
