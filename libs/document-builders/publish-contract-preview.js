import { putObject, getPresignedUrl } from '../s3-v3.js';

/** Prefijo S3 para borradores generados al previsualizar contratos (debe coincidir con la validación en api-notification). */
export const CONTRACT_PREVIEW_S3_PREFIX = 'contracts/preview';

/** Validez de la URL GET prefirmada (segundos). Misma convención que presign-comprobante-descarga. */
export const CONTRACT_PREVIEW_URL_EXPIRES_SECONDS = 900;

/**
 * @description Sube un PDF de vista previa al bucket y devuelve URL GET prefirmada usando `getPresignedUrl` de s3-v3.
 * @param {{ bucket: string, buffer: Buffer }} params
 * @returns {Promise<{ previewUrl: string, previewKey: string, expiresIn: number }>}
 */
export async function publishContractPreviewPdf({ bucket, buffer }) {
  const id = crypto.randomUUID();
  const previewKey = `${CONTRACT_PREVIEW_S3_PREFIX}/${id}.pdf`;

  await putObject({
    Bucket: bucket,
    Key: previewKey,
    Body: buffer,
    ContentType: 'application/pdf',
  });

  const previewUrl = await getPresignedUrl(
    { Bucket: bucket, Key: previewKey },
    CONTRACT_PREVIEW_URL_EXPIRES_SECONDS,
  );

  return {
    previewUrl,
    previewKey,
    expiresIn: CONTRACT_PREVIEW_URL_EXPIRES_SECONDS,
  };
}
