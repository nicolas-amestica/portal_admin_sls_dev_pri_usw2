/**
 * @description Escapa texto para inserción segura en HTML.
 * @param {unknown} value
 * @returns {string}
 */
export const escapeHtml = (value) => {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * @description Convierte detalle a HTML: escapado, saltos de línea y `**negrita**` (párrafos itinerario / listas).
 * @param {unknown} text
 * @returns {string}
 */
export const formatDetailAsHtml = (text) => {
  const raw = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  const parts = raw.split(/\*\*/);
  return parts
    .map((part, i) => {
      const esc = escapeHtml(part).replace(/\n/g, '<br>');
      return i % 2 === 1 ? `<strong>${esc}</strong>` : esc;
    })
    .join('');
};
