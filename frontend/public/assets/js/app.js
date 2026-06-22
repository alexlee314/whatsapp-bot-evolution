import { REFRESH_MS } from './utils/config.js';
import { init, refresh, startAutoRefresh } from './controllers/DashboardController.js';
import { initPagination } from './views/DashboardView.js';

initPagination();
init();
startAutoRefresh(REFRESH_MS, refresh);
