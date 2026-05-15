import { sortCommentsDescByCreatedAt } from './fn-sort-comments-desc.js';

/**
 * @description Garantiza comments como arreglo ordenado para respuestas HTTP.
 */
export const normalizeTicketForResponse = (item) => {
  if (!item || typeof item !== 'object') return item;
  const raw = Array.isArray(item.comments) ? item.comments : [];
  return {
    ...item,
    comments: sortCommentsDescByCreatedAt(raw),
  };
};
