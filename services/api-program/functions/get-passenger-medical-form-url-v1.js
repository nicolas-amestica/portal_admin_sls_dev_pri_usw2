import { success } from '../../../helpers/responses.js';
import { getPresignedUrl } from '../../../libs/s3-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';

const EXPIRES_IN = 300;
const ACTION = 'Generar URL de descarga de ficha médica de pasajero.';

const { BUCKET_INFO_GI } = process.env;

/**
 * Genera y retorna una URL prefirmada GET para descargar o visualizar
 * la ficha médica de un pasajero desde S3.
 *
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

  const downloadUrl = await getPresignedUrl(
    { Bucket: BUCKET_INFO_GI, Key: s3Key },
    EXPIRES_IN,
  );

  return success(200, { downloadUrl }, ACTION);
};

export const main = standardMiddleware(handler);
