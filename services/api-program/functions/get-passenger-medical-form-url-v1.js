import { success } from '../../../helpers/responses.js';
import { getPresignedUrl } from '../../../libs/s3-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';

const EXPIRES_IN = 300;
const ACTION = 'Generar URL de descarga de ficha médica de pasajero.';

const { BUCKET_INFO_GI } = process.env;

/** Prefijo donde el presign de subida coloca fichas individuales. */
const PREFIX = 'fichas-medicas';

/**
 * Solo fichas subidas por presign (`fichas-medicas/<nombre>` sin subcarpetas).
 * Plantilla `fichas-medicas/formato-base/...` queda fuera → usar GET …/plantilla.
 *
 * @description Evita uso del endpoint como lector arbitrario del bucket.
 * @param {string} key Clave decodificada ya sin espacios externos sobrantes.
 */
const isAllowedPassengerUploadedKey = (key) => {
  const trimmed = key.trim();
  if (!trimmed || trimmed.includes('..')) return false;
  const segments = trimmed.split('/').filter(Boolean);
  if (segments.length !== 2 || segments[0] !== PREFIX) return false;
  const fileSegment = segments[1];
  if (!fileSegment) return false;
  const allowedExt = /\.(pdf|jpg|jpeg|png)$/i;
  return allowedExt.test(fileSegment);
};

/**
 * Genera y retorna una URL prefirmada GET para descargar o visualizar
 * la ficha médica subida de un pasajero desde S3.
 *
 * @description Rechaza claves que no coinciden con el formato de subidas vía presign.
 * @example
 * GET /v1/pasajeros/ficha-medica/url?s3Key=fichas-medicas%2F...
 */
const handler = async (event) => {
  const s3Key = decodeURIComponent(event.queryParams?.s3Key ?? '');

  if (!s3Key) {
    const error = new Error('La clave S3 del archivo es requerida.');
    error.statusCode = 400;
    throw error;
  }

  if (!isAllowedPassengerUploadedKey(s3Key)) {
    const error = new Error('Clave de objeto no permitida.');
    error.statusCode = 400;
    throw error;
  }

  const downloadUrl = await getPresignedUrl(
    { Bucket: BUCKET_INFO_GI, Key: s3Key.trim() },
    EXPIRES_IN,
  );

  return success(200, { downloadUrl }, ACTION);
};

export const main = standardMiddleware(handler);
