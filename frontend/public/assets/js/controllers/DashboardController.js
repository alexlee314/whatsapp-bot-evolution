import { getPassword, setPassword, clearPassword } from '../models/AuthModel.js';
import { load } from '../models/DashboardModel.js';
import * as AuthView from '../views/AuthView.js';
import * as DashboardView from '../views/DashboardView.js';

export async function login(password) {
  setPassword(password);

  const result = await load(password);

  if (result.unauthorized) {
    clearPassword();
    AuthView.showAuth('Contraseña incorrecta');
    return false;
  }

  if (!result.ok) {
    clearPassword();
    AuthView.showAuth('No se pudo conectar al servidor');
    return false;
  }

  DashboardView.render(result.data);
  AuthView.showDashboard();
  return true;
}

export async function refresh() {
  const password = getPassword();
  if (!password) return false;

  try {
    const result = await load(password);

    if (result.unauthorized) {
      clearPassword();
      AuthView.showAuth('Contraseña incorrecta');
      return false;
    }

    if (!result.ok) {
      throw new Error('Failed to load dashboard data');
    }

    DashboardView.render(result.data);
    return true;
  } catch (error) {
    console.error(error);
    DashboardView.renderConnectionError();
    return false;
  }
}

export function init() {
  AuthView.bindSubmit(login);

  if (getPassword()) {
    AuthView.showDashboard();
    refresh();
  }
}

export function startAutoRefresh(intervalMs, tick) {
  setInterval(() => {
    if (document.hidden) return;
    tick();
  }, intervalMs);
}
