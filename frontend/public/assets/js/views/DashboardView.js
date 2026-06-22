import { formatDate, formatTimeNow } from '../utils/format.js';
import { paginate } from '../utils/pagination.js';
import { bindPaginationBar, renderPaginationBar } from './PaginationView.js';

const pages = {
  active: 1,
  conversations: 1,
  payments: 1,
};

let cachedData = null;

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

function renderPaginatedTable({
  rows,
  pageKey,
  tbodyId,
  paginationId,
  columnCount,
  emptyMessage,
  buildRowHtml,
}) {
  const meta = paginate(rows, pages[pageKey]);
  pages[pageKey] = meta.page;

  syncTableRows(document.getElementById(tbodyId), meta.items, columnCount, emptyMessage, buildRowHtml);
  renderPaginationBar(document.getElementById(paginationId), meta);
}

function renderSummary(summary) {
  updateText('stat-conversations', summary.total_conversations);
  updateText('stat-active', summary.active_sessions);
  updateText('stat-payments', summary.payments_today);
  updateText('stat-revenue', summary.revenue_today.toFixed(2));
}

function renderActiveSessions(rows) {
  renderPaginatedTable({
    rows,
    pageKey: 'active',
    tbodyId: 'active-sessions-body',
    paginationId: 'active-sessions-pagination',
    columnCount: 4,
    emptyMessage: 'No hay sesiones activas',
    buildRowHtml: (row) => `
      <td>${row.phone}</td>
      <td>${formatDate(row.session_started)}</td>
      <td>${row.status === 'active' ? `${row.time_remaining_minutes} min` : '—'}</td>
      <td><span class="badge ${row.status}">${row.status === 'active' ? 'Activa' : 'Finalizada'}</span></td>
    `,
  });
}

function renderConversations(rows) {
  renderPaginatedTable({
    rows,
    pageKey: 'conversations',
    tbodyId: 'conversations-body',
    paginationId: 'conversations-pagination',
    columnCount: 6,
    emptyMessage: 'Sin conversaciones registradas',
    buildRowHtml: (row) => `
      <td>${row.phone}</td>
      <td>${formatDate(row.first_contact)}</td>
      <td><span class="state-tag" title="${row.state}">${row.state}</span></td>
      <td>${row.messages_exchanged}</td>
      <td>${row.payment_received ? '✅' : '❌'}</td>
      <td>${formatDate(row.last_message)}</td>
    `,
  });
}

function renderPayments(rows) {
  renderPaginatedTable({
    rows,
    pageKey: 'payments',
    tbodyId: 'payments-body',
    paginationId: 'payments-pagination',
    columnCount: 4,
    emptyMessage: 'Sin pagos registrados',
    buildRowHtml: (row) => `
      <td>${row.phone}</td>
      <td>${formatDate(row.payment_received_at)}</td>
      <td>${formatDate(row.session_started)}</td>
      <td>${row.session_ended === 'Active' ? '<span class="badge active">Activa</span>' : formatDate(row.session_ended)}</td>
    `,
  });
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

function rerenderTable(pageKey) {
  if (!cachedData) return;

  if (pageKey === 'active') renderActiveSessions(cachedData.active_sessions);
  if (pageKey === 'conversations') renderConversations(cachedData.conversations);
  if (pageKey === 'payments') renderPayments(cachedData.payments);
}

export function initPagination() {
  bindPaginationBar(document.getElementById('active-sessions-pagination'), (delta) => {
    pages.active += delta;
    rerenderTable('active');
  });

  bindPaginationBar(document.getElementById('conversations-pagination'), (delta) => {
    pages.conversations += delta;
    rerenderTable('conversations');
  });

  bindPaginationBar(document.getElementById('payments-pagination'), (delta) => {
    pages.payments += delta;
    rerenderTable('payments');
  });
}

export function render(data) {
  cachedData = data;
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
