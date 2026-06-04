import { formatDate, formatTimeNow } from '../utils/format.js';

function renderEmptyRow(tbody, columnCount, message) {
  tbody.replaceChildren();
  const tr = document.createElement('tr');
  tr.innerHTML = `<td colspan="${columnCount}" class="empty">${message}</td>`;
  tbody.appendChild(tr);
}

function updateText(id, value) {
  const el = document.getElementById(id);
  const next = String(value);
  if (el && el.textContent !== next) {
    el.textContent = next;
  }
}

function syncTableRows(tbody, rows, columnCount, emptyMessage, buildRowHtml) {
  if (!rows.length) {
    if (tbody.dataset.mode !== 'empty') {
      renderEmptyRow(tbody, columnCount, emptyMessage);
      tbody.dataset.mode = 'empty';
    }
    return;
  }

  tbody.dataset.mode = 'rows';

  rows.forEach((row, index) => {
    const html = buildRowHtml(row);
    let tr = tbody.children[index];

    if (!tr) {
      tr = document.createElement('tr');
      tbody.appendChild(tr);
    }

    if (tr.innerHTML !== html) {
      tr.innerHTML = html;
    }
  });

  while (tbody.children.length > rows.length) {
    tbody.removeChild(tbody.lastChild);
  }
}

function renderSummary(summary) {
  updateText('stat-conversations', summary.total_conversations);
  updateText('stat-active', summary.active_sessions);
  updateText('stat-payments', summary.payments_today);
  updateText('stat-revenue', summary.revenue_today.toFixed(2));
}

function renderActiveSessions(rows) {
  syncTableRows(
    document.getElementById('active-sessions-body'),
    rows,
    4,
    'No hay sesiones activas',
    (row) => `
      <td>${row.phone}</td>
      <td>${formatDate(row.session_started)}</td>
      <td>${row.status === 'active' ? `${row.time_remaining_minutes} min` : '—'}</td>
      <td><span class="badge ${row.status}">${row.status === 'active' ? 'Activa' : 'Finalizada'}</span></td>
    `
  );
}

function renderConversations(rows) {
  syncTableRows(
    document.getElementById('conversations-body'),
    rows,
    6,
    'Sin conversaciones registradas',
    (row) => `
      <td>${row.phone}</td>
      <td>${formatDate(row.first_contact)}</td>
      <td><span class="state-tag">${row.state}</span></td>
      <td>${row.messages_exchanged}</td>
      <td>${row.payment_received ? '✅' : '❌'}</td>
      <td>${formatDate(row.last_message)}</td>
    `
  );
}

function renderPayments(rows) {
  syncTableRows(
    document.getElementById('payments-body'),
    rows,
    4,
    'Sin pagos registrados',
    (row) => `
      <td>${row.phone}</td>
      <td>${formatDate(row.payment_received_at)}</td>
      <td>${formatDate(row.session_started)}</td>
      <td>${row.session_ended === 'Active' ? '<span class="badge active">Activa</span>' : formatDate(row.session_ended)}</td>
    `
  );
}

function updateTimestamp() {
  const el = document.getElementById('last-updated');
  if (!el) return;

  const next = `Actualizado: ${formatTimeNow()}`;
  if (el.textContent !== next) {
    el.textContent = next;
    el.classList.remove('timestamp-flash');
    void el.offsetWidth;
    el.classList.add('timestamp-flash');
  }
}

export function render(data) {
  renderSummary(data.summary);
  renderActiveSessions(data.active_sessions);
  renderConversations(data.conversations);
  renderPayments(data.payments);
  updateTimestamp();
}

export function renderConnectionError() {
  const el = document.getElementById('last-updated');
  if (el) el.textContent = 'Error de conexión';
}
