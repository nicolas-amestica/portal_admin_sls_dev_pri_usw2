import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { putPresignedUrl } from '../../../libs/s3-v3.js';
import { requireStaffProfile } from '../helpers/portal-jwt-auth.js';
import { VALID_SCOPES } from '../helpers/informative-media-constants.js';

const ACTION = 'Presign subida de medio informativo';
const EXPIRES_IN = 300;

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

/**
 * @description Genera URL PUT prefirmada para subir imagen o video al bucket de información.
 * Body: { mimeType, scope } — scope ej. CLIENT_HOME.
 */
const handler = async (event) => {
  await requireStaffProfile(event.headers ?? {});
  const { mimeType, scope } = event.body ?? {};
  const normalized = String(mimeType ?? '')
    .toLowerCase()
    .trim();

  if (!normalized || !MIME_EXT[normalized]) {
    const err = new Error(
      `Tipo MIME no permitido. Use: ${Object.keys(MIME_EXT).join(', ')}.`,
    );
    err.statusCode = 400;
    throw err;
  }

  const sc = String(scope ?? '').trim();
  if (!VALID_SCOPES.has(sc)) {
    const err = new Error(`Ámbito no válido. Permitidos: ${[...VALID_SCOPES].join(', ')}.`);
    err.statusCode = 400;
    throw err;
  }

  const ext = MIME_EXT[normalized];
  const s3Key = `assets/informative-media/${sc}/${crypto.randomUUID()}.${ext}`;
  const bucket = process.env.BUCKET_INFO_GI;
  if (!bucket) {
    const err = new Error('Bucket no configurado.');
    err.statusCode = 500;
    throw err;
  }

  const uploadUrl = await putPresignedUrl(
    { Bucket: bucket, Key: s3Key, ContentType: normalized },
    EXPIRES_IN,
  );

  const mediaType = normalized.startsWith('video/') ? 'video' : 'image';

  return success(200, { uploadUrl, s3Key, mediaType }, ACTION);
};

export const main = standardMiddleware(handler);
