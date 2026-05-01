import { uuidv7 } from 'uuidv7';
import { success } from '../../../helpers/responses.js';
import { putPresignedUrl } from '../../../libs/s3-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';

const EXPIRES_IN = 300;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const EXT_MAP = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};
const ACTION = 'Generar URL de subida para ficha médica de pasajero.';

const { BUCKET_INFO_GI } = process.env;

/**
 * Expone una URL prefirmada PUT para subir la ficha médica de un pasajero
 * directamente a S3 (prefijo `fichas-medicas/`). Acepta PDF e imágenes.
 *
 * @example
 * POST /v1/pasajeros/ficha-medica/presign
 * Body: { mimeType: "application/pdf" }
 */
const handler = async (event) => {
  const { mimeType } = event.body || {};
  const normalized = (mimeType || '').toLowerCase().trim();

  if (!ALLOWED_TYPES.includes(normalized)) {
    const error = new Error('Solo se permiten archivos PDF, JPEG o PNG.');
    error.statusCode = 400;
    throw error;
  }

  const ext = EXT_MAP[normalized];
  const s3Key = `fichas-medicas/${uuidv7()}.${ext}`;
  const uploadUrl = await putPresignedUrl(
    { Bucket: BUCKET_INFO_GI, Key: s3Key, ContentType: normalized },
    EXPIRES_IN,
  );

  return success(200, { uploadUrl, s3Key }, ACTION);
};

export const main = standardMiddleware(handler);
