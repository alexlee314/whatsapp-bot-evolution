import { STORAGE_KEY, API_URL, PASSWORD_URL } from '../utils/config.js';

export function getPassword() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setPassword(password) {
  localStorage.setItem(STORAGE_KEY, password);
}

export function clearPassword() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function fetchDashboardData(password) {
  return fetch(API_URL, {
    headers: { 'X-Dashboard-Password': password },
  });
}

export async function changeDashboardPassword(currentPassword, newPassword, confirmPassword) {
  return fetch(PASSWORD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dashboard-Password': currentPassword,
    },
    body: JSON.stringify({ newPassword, confirmPassword }),
  });
}
