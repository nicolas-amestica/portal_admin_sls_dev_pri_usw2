/**
 * @description Ordena comentarios por fecha de creación descendente (más reciente primero).
 */
export const sortCommentsDescByCreatedAt = (comments) => {
  if (!Array.isArray(comments)) return [];
  return [...comments].sort((a, b) => {
    const ta = new Date(a.createdAt ?? 0).getTime();
    const tb = new Date(b.createdAt ?? 0).getTime();
    return tb - ta;
  });
};
