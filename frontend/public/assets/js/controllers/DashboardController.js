import { getPassword, setPassword, clearPassword, changeDashboardPassword } from '../models/AuthModel.js';
import { load } from '../models/DashboardModel.js';
import { MIN_PASSWORD_LENGTH } from '../utils/config.js';
import * as AuthView from '../views/AuthView.js';
import * as DashboardView from '../views/DashboardView.js';
import * as SettingsView from '../views/SettingsView.js';

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
  SettingsView.bindPasswordModal(SettingsView.openPasswordModal);
  SettingsView.bindPasswordChange(handlePasswordChange);
  SettingsView.bindLogout(logout);

  if (getPassword()) {
    AuthView.showDashboard();
    refresh();
  }
}

async function handlePasswordChange({ currentPassword, newPassword, confirmPassword }) {
  const stored = getPassword();

  if (currentPassword !== stored) {
    SettingsView.showPasswordError('La contraseña actual no coincide con tu sesión.');
    return;
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    SettingsView.showPasswordError(`La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    return;
  }

  if (newPassword !== confirmPassword) {
    SettingsView.showPasswordError('La confirmación no coincide.');
    return;
  }

  try {
    const response = await changeDashboardPassword(stored, newPassword, confirmPassword);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      SettingsView.showPasswordError(payload.error || 'No se pudo actualizar la contraseña.');
      return;
    }

    setPassword(newPassword);
    SettingsView.showPasswordSuccess(payload.message || 'Contraseña actualizada.');
    setTimeout(() => SettingsView.closePasswordModal(), 1500);
  } catch (error) {
    SettingsView.showPasswordError('No se pudo conectar al servidor.');
  }
}

function logout() {
  clearPassword();
  AuthView.showAuth();
}

export function startAutoRefresh(intervalMs, tick) {
  setInterval(() => {
    if (document.hidden) return;
    tick();
  }, intervalMs);
}
