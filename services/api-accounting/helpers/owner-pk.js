/**
 * @description Normaliza `pk` de partición (USR#...) desde body o query ya decodificado.
 * @param {string|undefined} pkRaw - Valor pk (ej. USR#uuid o solo uuid).
 * @returns {{ pk: string, userId: string }|null}
 */
export function normalizeOwnerPk(pkRaw) {
  if (!pkRaw || typeof pkRaw !== 'string') return null;
  const trimmed = String(pkRaw).trim();
  if (!trimmed) return null;
  const pk = trimmed.startsWith('USR#') ? trimmed : `USR#${trimmed}`;
  const userId = pk.slice(4);
  if (!userId) return null;
  return { pk, userId };
}
