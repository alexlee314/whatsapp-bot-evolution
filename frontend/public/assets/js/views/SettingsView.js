const passwordModal = document.getElementById('password-modal');
const passwordModalBackdrop = document.getElementById('password-modal-backdrop');
const passwordModalClose = document.getElementById('password-modal-close');
const passwordChangeBtn = document.getElementById('password-change-btn');
const passwordForm = document.getElementById('password-form');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const passwordMessage = document.getElementById('password-message');
const logoutBtn = document.getElementById('logout-btn');
const dashboardWrap = document.querySelector('#dashboard .wrap');

function clearPasswordForm() {
  currentPasswordInput.value = '';
  newPasswordInput.value = '';
  confirmPasswordInput.value = '';
  passwordMessage.textContent = '';
  passwordMessage.className = 'settings-message';
}

function lockDashboard() {
  document.body.classList.add('modal-open');
  dashboardWrap?.setAttribute('inert', '');
  dashboardWrap?.setAttribute('aria-hidden', 'true');
}

function unlockDashboard() {
  document.body.classList.remove('modal-open');
  dashboardWrap?.removeAttribute('inert');
  dashboardWrap?.removeAttribute('aria-hidden');
}

export function openPasswordModal() {
  clearPasswordForm();
  passwordModal.classList.remove('hidden');
  passwordModal.setAttribute('aria-hidden', 'false');
  lockDashboard();
  currentPasswordInput.focus();
}

export function closePasswordModal() {
  passwordModal.classList.add('hidden');
  passwordModal.setAttribute('aria-hidden', 'true');
  unlockDashboard();
  clearPasswordForm();
  passwordChangeBtn.focus();
}

export function bindPasswordModal(onOpen) {
  passwordChangeBtn.addEventListener('click', onOpen);

  passwordModalClose.addEventListener('click', closePasswordModal);
  passwordModalBackdrop.addEventListener('click', closePasswordModal);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !passwordModal.classList.contains('hidden')) {
      closePasswordModal();
    }
  });
}

export function bindPasswordChange(onSubmit) {
  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    passwordMessage.textContent = '';
    passwordMessage.className = 'settings-message';

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    await onSubmit({ currentPassword, newPassword, confirmPassword });
  });
}

export function showPasswordSuccess(message) {
  passwordMessage.textContent = message;
  passwordMessage.className = 'settings-message success';
}

export function showPasswordError(message) {
  passwordMessage.textContent = message;
  passwordMessage.className = 'settings-message error';
}

export function bindLogout(onLogout) {
  logoutBtn.addEventListener('click', onLogout);
}
