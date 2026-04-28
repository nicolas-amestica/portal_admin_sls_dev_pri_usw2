import { success } from '../../../helpers/responses.js';
import { getPresignedUrl } from '../../../libs/s3-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';

const { BUCKET_INFO_GI } = process.env;

/** Validez de la URL prefirmada (10 minutos). */
const EXPIRES_IN = 600;

/** Solo claves generadas por subir-comprobante (evita lectura arbitraria del bucket). */
const ALLOWED_KEY = /^contabilidad\/(ingresos|gastos)\/[^/]+$/;

const ACTION = 'URL prefirmada de descarga de comprobante';

/**
 * @description Devuelve una URL GET prefirmada para descargar el comprobante en S3.
 */
const handler = async (event) => {
  const { key } = event.queryParams || {};

  if (!key || typeof key !== 'string') {
    const error = new Error('El parámetro key es requerido.');
    error.statusCode = 400;
    throw error;
  }

  const trimmed = key.trim();
  if (trimmed.includes('..') || !ALLOWED_KEY.test(trimmed)) {
    const error = new Error('Clave de objeto no permitida.');
    error.statusCode = 400;
    throw error;
  }

  const url = await getPresignedUrl({ Bucket: BUCKET_INFO_GI, Key: trimmed }, EXPIRES_IN);

  return success(200, { url, expiresIn: EXPIRES_IN }, ACTION);
};

export const main = standardMiddleware(handler);
