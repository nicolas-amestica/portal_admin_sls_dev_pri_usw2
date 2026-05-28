/**
 * @description Sanitiza el texto del usuario antes de persistirlo en el historial.
 * @param {string} text
 * @returns {string}
 */
export function sanitizeForHistory(text) {
  if (!text) return '';
  return text
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/^(system|assistant|user|model)\s*:/gim, '')
    .replace(/<\|.*?\|>/g, '')
    .replace(/###\s*(system|instruction|prompt)/gi, '')
    .trim();
}
