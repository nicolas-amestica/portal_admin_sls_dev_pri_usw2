import { success } from '../../../helpers/responses.js';
import { getPresignedUrl, putPresignedUrl } from '../../../libs/s3-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { buildTicketS3Key } from '../helpers/fn-build-s3-key.js';

const ACTION = 'URL prefirmada para ticket (S3)';
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/**
 * @description Genera URL de subida (PUT) o lectura (GET) para objetos bajo tickets/.
 */
const handler = async (event) => {
  const q = event.queryParams ?? {};
  const bucket = process.env.BUCKET_INFO_GI;
  const region = process.env.AWS_REGION || 'us-west-2';

  if (q.key) {
    const key = String(q.key);
    if (!key.startsWith('tickets/')) {
      const err = new Error('key inválida');
      err.statusCode = 400;
      throw err;
    }
    const downloadUrl = await getPresignedUrl({ Bucket: bucket, Key: key }, 300);
    return success(200, { downloadUrl, key, maxSize: MAX_SIZE }, ACTION);
  }

  const { ticketId, fileName, contentType } = q;
  if (!fileName || !contentType) {
    const err = new Error('fileName y contentType son requeridos');
    err.statusCode = 400;
    throw err;
  }
  if (!ALLOWED.includes(contentType)) {
    const err = new Error(`Tipo no permitido: ${contentType}`);
    err.statusCode = 415;
    throw err;
  }

  const key = buildTicketS3Key(ticketId || undefined, fileName);
  const uploadUrl = await putPresignedUrl(
    {
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    },
    300,
  );

  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  return success(200, { uploadUrl, key, publicUrl, maxSize: MAX_SIZE }, ACTION);
};

export const main = standardMiddleware(handler);
