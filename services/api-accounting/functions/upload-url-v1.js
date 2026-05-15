import { randomUUID } from '../../../libs/crypto.js';
import { putPresignedUrl } from '../../../libs/s3-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';

const ACTION = 'Generar URL de subida de comprobante';
const EXPIRES_IN = 300; // 5 minutos

/**
 * Genera una URL prefirmada de S3 para que el frontend suba comprobantes
 * directamente sin pasar por Lambda. Evita costos de transferencia.
 *
 * @param {object} event - Evento HTTP con body { contentType, extension, tipo }.
 * @returns {{ uploadUrl: string, s3Key: string }}
 */
const handler = async (event) => {
  const { contentType, extension, tipo = 'gasto' } = event.body;

  if (!contentType || !extension) {
    const error = new Error('Los campos contentType y extension son requeridos.');
    error.statusCode = 400;
    throw error;
  }

  const ext = String(extension).trim().toLowerCase().replace(/^\./, '');
  if (!/^[a-z0-9]{1,10}$/.test(ext)) {
    const error = new Error('Extensión de archivo no permitida.');
    error.statusCode = 400;
    throw error;
  }

  const folder = tipo === 'ingreso' ? 'contabilidad/ingresos' : 'contabilidad/gastos';
  const s3Key = `${folder}/${randomUUID()}.${ext}`;

  const uploadUrl = await putPresignedUrl(
    { Bucket: process.env.BUCKET_INFO_GI, Key: s3Key, ContentType: contentType },
    EXPIRES_IN
  );

  return success(200, { uploadUrl, s3Key }, ACTION);
};

export const main = standardMiddleware(handler);
