/**
 * Validación de `document.images[].src` en la API.
 * Las URLs http(s) se descargan en servidor y se convierten a data URL antes del HTML (`resolve-document-image-urls.js`).
 */

/** Longitud máxima aceptada para un data URL (evita payloads enormes). */
const MAX_DATA_URL_CHARS = 8 * 1024 * 1024;

/** Longitud máxima para URL https/http en el payload. */
const MAX_HTTPS_URL_CHARS = 2048;

const DATA_IMAGE_PREFIX_RE = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i;

/**
 * @description Comprime espacios en la parte base64 de un data URL (válido para decodificación).
 * @param {string} dataUrl
 * @returns {string}
 */
const normalizeDataUrlWhitespace = (dataUrl) => {
  const i = dataUrl.indexOf(',');
  if (i === -1) return dataUrl;
  const head = dataUrl.slice(0, i + 1);
  const b64 = dataUrl.slice(i + 1).replace(/\s/g, '');
  return `${head}${b64}`;
};

/**
 * @description Valida y normaliza `src` para `<img>` en PDF (solo data:image/*;base64 o https).
 * En offline también permite http://localhost y http://127.0.0.1 para desarrollo.
 * @param {unknown} raw
 * @returns {string}
 * @throws {Error} Con statusCode 400 si no es seguro o no permitido
 */
export const validateAndNormalizeImageSrc = (raw) => {
  let s = String(raw ?? '').trim();
  if (!s) {
    const err = new Error('document.images[].src es requerido.');
    err.statusCode = 400;
    throw err;
  }

  if (s.includes('"') || s.includes('<') || s.includes('>')) {
    const err = new Error('document.images[].src contiene caracteres no permitidos.');
    err.statusCode = 400;
    throw err;
  }

  if (DATA_IMAGE_PREFIX_RE.test(s)) {
    if (s.length > MAX_DATA_URL_CHARS) {
      const err = new Error(
        `document.images[].src (data URL) supera el tamaño máximo permitido (${MAX_DATA_URL_CHARS} caracteres).`,
      );
      err.statusCode = 400;
      throw err;
    }
    return normalizeDataUrlWhitespace(s);
  }

  if (s.startsWith('https://')) {
    if (s.length > MAX_HTTPS_URL_CHARS) {
      const err = new Error('document.images[].src (https) es demasiado largo.');
      err.statusCode = 400;
      throw err;
    }
    return s;
  }

  const allowLocalHttp =
    process.env.IS_OFFLINE === 'true' &&
    /^\s*http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(s);
  if (allowLocalHttp && s.length <= MAX_HTTPS_URL_CHARS) {
    return s;
  }

  const err = new Error(
    'document.images[].src debe ser data:image/png|jpeg|jpg|gif|webp;base64,... o una URL https:// (en offline también http://localhost o http://127.0.0.1).',
  );
  err.statusCode = 400;
  throw err;
};
