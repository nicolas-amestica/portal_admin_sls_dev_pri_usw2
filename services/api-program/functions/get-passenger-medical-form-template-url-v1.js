import { success } from '../../../helpers/responses.js';
import { getPresignedUrl } from '../../../libs/s3-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';

const EXPIRES_IN = 300;
const ACTION = 'Generar URL de descarga de plantilla de ficha médica.';

const { BUCKET_INFO_GI, MEDICAL_FORM_TEMPLATE_S3_KEY } = process.env;

const DEFAULT_TEMPLATE_KEY = 'fichas-medicas/formato-base/ficha-medica-base.pdf';

/**
 * Genera una URL prefirmada GET para el PDF plantilla oficial de la ficha médica
 * (clave fija en configuración; bucket privado).
 *
 * @description Expone prefirma para descarga sin URL pública al objeto en S3.
 * @example GET /v1/pasajeros/ficha-medica/plantilla
 */
const handler = async () => {
  const s3Key = (MEDICAL_FORM_TEMPLATE_S3_KEY || '').trim() || DEFAULT_TEMPLATE_KEY;

  if (!BUCKET_INFO_GI) {
    const error = new Error('Bucket de información no configurado.');
    error.statusCode = 500;
    throw error;
  }

  const downloadUrl = await getPresignedUrl(
    { Bucket: BUCKET_INFO_GI, Key: s3Key },
    EXPIRES_IN,
  );

  return success(200, { downloadUrl, expiresIn: EXPIRES_IN }, ACTION);
};

export const main = standardMiddleware(handler);
