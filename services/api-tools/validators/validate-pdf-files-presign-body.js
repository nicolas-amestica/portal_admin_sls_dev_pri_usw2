const MAX_FILES = 20;
const ACCEPT_MIME_PRIMARY = 'application/pdf';
/**
 * @description Normaliza y valida el arreglo de archivos solicitados para presign PUT.
 */
export function validatePdfFilesForPresign(body) {
  const files = body?.files;
  if (!Array.isArray(files) || files.length < 1) {
    const err = new Error('Se requiere un arreglo `files` con al menos un PDF.');
    err.statusCode = 400;
    throw err;
  }
  if (files.length > MAX_FILES) {
    const err = new Error(`Se permiten máximo ${MAX_FILES} archivos PDF por operación.`);
    err.statusCode = 400;
    throw err;
  }

  const normalized = [];

  for (const item of files) {
    const fileName = typeof item?.fileName === 'string' ? item.fileName.trim() : '';
    const contentType = typeof item?.contentType === 'string' ? item.contentType.trim().toLowerCase() : '';

    if (!fileName || fileName.length > 260) {
      const err = new Error('Nombre de archivo inválido o demasiado largo.');
      err.statusCode = 400;
      throw err;
    }
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      const err = new Error('Nombre de archivo no permitido.');
      err.statusCode = 400;
      throw err;
    }
    const lowerName = fileName.toLowerCase();
    if (!lowerName.endsWith('.pdf')) {
      const err = new Error('Todos los archivos deben tener extensión .pdf.');
      err.statusCode = 400;
      throw err;
    }

    const lowered = contentType.toLowerCase();
    const acceptable =
      !contentType ||
      lowered === ACCEPT_MIME_PRIMARY ||
      lowered === 'application/octet-stream' ||
      lowered === 'binary/octet-stream';

    if (!acceptable) {
      const err = new Error(
        'contentType debe ser application/pdf, vacío u octet-stream cuando se informe.',
      );
      err.statusCode = 400;
      throw err;
    }

    normalized.push({
      fileName,
      /** Content-Type que el browser usará en el PUT prefirmado. */
      contentType: ACCEPT_MIME_PRIMARY,
    });
  }

  return normalized;
}

/**
 * @description Slug estable para usar en prefijo de claves S3.
 * @param {string} originalName
 */
export function slugPdfFileName(originalName) {
  const stem = originalName.replace(/\.pdf$/i, '').slice(0, 120).trim();
  const cleaned = stem.replace(/[^\w\s.-]/g, '_').replace(/^_+|_+$/g, '') || 'documento';
  return cleaned.slice(0, 120);
}
