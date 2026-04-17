import { uuidv7 } from 'uuidv7';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { putPresignedUrl } from '../../../libs/s3-v3.js';

const ACTION = 'Presign adjunto S3';
const EXPIRES_IN = 300; // 5 minutos

/**
 * @description Genera una URL prefirmada de S3 para que el frontend suba un adjunto
 * directamente sin pasar por API Gateway. Evita el límite de 10 MB de payload y el
 * coste de transferencia base64 a través de Lambda.
 *
 * @param {object} event - Evento HTTP con body { fileName, mimeType }.
 * @returns {{ uploadUrl: string, s3Key: string }}
 */
export const main = async (event) => {
  try {
    const { fileName, mimeType } = parseEventBody(event);

    if (!fileName || !mimeType) {
      const err = Object.assign(new Error('fileName y mimeType son requeridos'), { statusCode: 400 });
      return unsuccessful(400, err, ACTION);
    }

    const s3Key = `inbox-adjuntos/${uuidv7()}/${fileName}`;
    const uploadUrl = await putPresignedUrl(
      { Bucket: process.env.BUCKET_INFO_GI, Key: s3Key, ContentType: mimeType },
      EXPIRES_IN
    );

    console.log(`[${ACTION}] Pre-signed URL generada para "${fileName}" → ${s3Key}`);
    return success(200, { uploadUrl, s3Key }, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
