/**
 * Une elementos en enumeración legible en español para contratos.
 * - 1: "A"
 * - 2: "A y B"
 * - 3+: "A, B, y C" (la conjunción "y" solo antes del último).
 *
 * @param {string[]} parts - Frases ya formateadas (p. ej. nombre + cédula).
 * @returns {string}
 */
export const joinSpanishEnumeration = (parts) => {
  const filtered = (parts ?? []).filter((p) => p != null && String(p).trim().length > 0);
  if (filtered.length === 0) return '';
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} y ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(', ')}, y ${filtered[filtered.length - 1]}`;
};
