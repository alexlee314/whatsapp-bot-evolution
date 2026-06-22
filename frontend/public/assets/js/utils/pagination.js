export const PAGE_SIZE = 10;

export function paginate(items, page) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);

  return {
    items: items.slice(startIndex, endIndex),
    page: safePage,
    totalPages,
    totalItems,
    startIndex: totalItems ? startIndex + 1 : 0,
    endIndex,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    showControls: totalItems > PAGE_SIZE,
  };
}
