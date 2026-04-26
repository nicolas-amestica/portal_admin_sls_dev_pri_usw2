/**
 * Scopes HTML→PDF (plantillas por tipo de documento).
 * BDA es alias de DBA (misma plantilla que DBA).
 */
export const HTML_DOCUMENT_SCOPES = ['CTM', 'CTT', 'DBA', 'DBR'];

/** @type {Record<string, string>} */
const SCOPE_ALIASES = {
  BDA: 'DBA',
};

/**
 * @description Normaliza el scope (mayúsculas y alias BDA→DBA).
 * @param {string} scope
 * @returns {string}
 */
export const normalizeHtmlDocumentScope = (scope) => {
  const u = String(scope || '').trim().toUpperCase();
  return SCOPE_ALIASES[u] || u;
};

/**
 * @description Indica si el scope es válido para documentos HTML.
 * @param {string} scope
 * @returns {boolean}
 */
export const isHtmlDocumentScope = (scope) => {
  const n = normalizeHtmlDocumentScope(scope);
  return HTML_DOCUMENT_SCOPES.includes(n);
};

/**
 * Temas visuales por scope (solo CSS).
 * @type {Record<string, { accent: string, accentSoft: string, border: string }>}
 */
export const SCOPE_THEMES = {
  CTM: { accent: '#1a365d', accentSoft: '#ebf4ff', border: '#90cdf4' },
  CTT: { accent: '#22543d', accentSoft: '#f0fff4', border: '#9ae6b4' },
  DBA: { accent: '#744210', accentSoft: '#fffff0', border: '#f6e05e' },
  DBR: { accent: '#702459', accentSoft: '#fff5f7', border: '#fbb6ce' },
};
