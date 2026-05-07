const MAX_FILES = 10;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * @description Valida metadatos de archivos adjuntos (key S3 bajo tickets/, url, nombre, tamaño, tipo).
 */
export const validateTicketFiles = (files) => {
  if (files === undefined || files === null) return [];
  if (!Array.isArray(files)) {
    const err = new Error('files debe ser un arreglo');
    err.statusCode = 400;
    throw err;
  }
  if (files.length > MAX_FILES) {
    const err = new Error(`Máximo ${MAX_FILES} archivos por elemento`);
    err.statusCode = 400;
    throw err;
  }
  for (const f of files) {
    if (!f?.key || typeof f.key !== 'string' || !f.key.startsWith('tickets/')) {
      const err = new Error('Cada archivo debe tener key válida bajo tickets/');
      err.statusCode = 400;
      throw err;
    }
    if (!f.url || typeof f.url !== 'string') {
      const err = new Error('Cada archivo debe tener url');
      err.statusCode = 400;
      throw err;
    }
    if (!f.name || typeof f.name !== 'string') {
      const err = new Error('Cada archivo debe tener name');
      err.statusCode = 400;
      throw err;
    }
    if (typeof f.size !== 'number' || f.size < 0 || f.size > MAX_FILE_BYTES) {
      const err = new Error('size inválido por archivo');
      err.statusCode = 400;
      throw err;
    }
    if (!f.contentType || typeof f.contentType !== 'string') {
      const err = new Error('Cada archivo debe tener contentType');
      err.statusCode = 400;
      throw err;
    }
  }
  return files;
};
