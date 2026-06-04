const authGate = document.getElementById('auth-gate');
const dashboard = document.getElementById('dashboard');
const authForm = document.getElementById('auth-form');
const passwordInput = document.getElementById('password-input');
const authError = document.getElementById('auth-error');

export function showDashboard() {
  authGate.classList.add('hidden');
  dashboard.classList.remove('hidden');
}

export function showAuth(errorMessage = '') {
  dashboard.classList.add('hidden');
  authGate.classList.remove('hidden');
  authError.textContent = errorMessage;
}

export function clearAuthError() {
  authError.textContent = '';
}

export function clearPasswordInput() {
  passwordInput.value = '';
}

export function bindSubmit(onSubmit) {
  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const password = passwordInput.value.trim();
    if (!password) return;

    clearAuthError();
    await onSubmit(password);
    clearPasswordInput();
  });
}
