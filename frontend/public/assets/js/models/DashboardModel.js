import { fetchDashboardData } from './AuthModel.js';

export async function load(password) {
  const response = await fetchDashboardData(password);

  if (response.status === 401) {
    return { ok: false, unauthorized: true };
  }

  if (!response.ok) {
    return { ok: false, unauthorized: false };
  }

  const data = await response.json();
  return { ok: true, data };
}
