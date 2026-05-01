/** Solo rutas relativas al SPA bajo `/app/` (sin query ni fragmentos). */
const INTERNAL_PATH_RE = /^\/app\/[a-zA-Z0-9\-_/]+$/;

const MAX_LEN = 500;

/**
 * @description Normaliza y valida `linkHref` / `linkLabel` para medios informativos (rutas internas del portal).
 * @param {unknown} linkHref
 * @param {unknown} linkLabel
 * @returns {{ linkHref: string, linkLabel: string }}
 */
export function normalizeInformativeMediaLink(linkHref, linkLabel) {
  const href =
    typeof linkHref === 'string' ? linkHref.trim().slice(0, MAX_LEN) : '';
  const label =
    typeof linkLabel === 'string' ? linkLabel.trim().slice(0, MAX_LEN) : '';

  if (!href && !label) {
    return { linkHref: '', linkLabel: '' };
  }

  if (href && !label) {
    const err = new Error(
      'Si indica enlace de destino, el texto visible del enlace es obligatorio.',
    );
    err.statusCode = 400;
    throw err;
  }

  if (!href && label) {
    const err = new Error(
      'Si indica texto visible del enlace, debe indicar también la ruta de destino.',
    );
    err.statusCode = 400;
    throw err;
  }

  if (!INTERNAL_PATH_RE.test(href)) {
    const err = new Error(
      'El enlace debe ser una ruta interna del portal (ej. /app/cliente/lista-pasajeros).',
    );
    err.statusCode = 400;
    throw err;
  }

  if (label.length < 2) {
    const err = new Error(
      'El texto visible del enlace debe tener al menos 2 caracteres.',
    );
    err.statusCode = 400;
    throw err;
  }

  return { linkHref: href, linkLabel: label };
}
