export function formatDate(iso) {
  if (!iso) return '—';

  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeNow() {
  return new Date().toLocaleTimeString('es-PE');
}
