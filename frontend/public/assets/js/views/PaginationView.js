export function renderPaginationBar(container, meta) {
  if (!container) return;

  if (!meta.showControls) {
    container.classList.add('hidden');
    container.replaceChildren();
    return;
  }

  container.classList.remove('hidden');
  container.innerHTML = `
    <button type="button" class="pagination-btn" data-action="prev" ${meta.hasPrev ? '' : 'disabled'}>
      Anterior
    </button>
    <span class="pagination-info">
      Página ${meta.page} de ${meta.totalPages}
      · ${meta.totalItems} registros
      · ${meta.startIndex}–${meta.endIndex}
    </span>
    <button type="button" class="pagination-btn" data-action="next" ${meta.hasNext ? '' : 'disabled'}>
      Siguiente
    </button>
  `;
}

export function bindPaginationBar(container, onChange) {
  if (!container || container.dataset.bound === 'true') return;

  container.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;

    const action = button.dataset.action;
    if (action === 'prev') onChange(-1);
    if (action === 'next') onChange(1);
  });

  container.dataset.bound = 'true';
}
