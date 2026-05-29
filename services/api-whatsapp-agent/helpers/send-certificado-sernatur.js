import { getObjectBuffer, getPresignedUrl } from '../../../libs/s3-v3.js';
import { uploadMedia, sendDocumentById } from './whatsapp-api.js';
import { sendMetaTextMessage } from './messenger-api.js';
import { shortenUrl } from './url-shortener.js';

export const SERNATUR_CERTIFICATE_S3_KEY = 'legales/certificado-sernatur.pdf';
export const SERNATUR_CERTIFICATE_FILENAME = 'certificado-sernatur.pdf';

export const SERNATUR_CAPTION_POST_PRESUPUESTO =
  'Te adjunto nuestro certificado de registro en Sernatur para que tengas mayor seguridad y confianza con nuestra empresa.';

export const SERNATUR_CAPTION_EXPLICITO =
  'Aquí tienes nuestro certificado de registro Sernatur como prestador de servicios turísticos en Chile.';

/**
 * @description Descarga el certificado Sernatur desde S3 y lo envía al cliente según el canal.
 * @param {'whatsapp'|'messenger'|'instagram'} channel
 * @param {string} phoneNumber
 * @param {{ motivo?: 'post_presupuesto'|'explicito' }} [options]
 * @returns {Promise<void>}
 */
export async function sendCertificadoSernatur(channel, phoneNumber, options = {}) {
  const { motivo = 'explicito' } = options;
  const bucket = process.env.BUCKET_INFO_GI;
  const caption =
    motivo === 'post_presupuesto' ? SERNATUR_CAPTION_POST_PRESUPUESTO : SERNATUR_CAPTION_EXPLICITO;

  if (channel === 'whatsapp') {
    const buffer = await getObjectBuffer({ Bucket: bucket, Key: SERNATUR_CERTIFICATE_S3_KEY });
    const mediaId = await uploadMedia(buffer, SERNATUR_CERTIFICATE_FILENAME, 'application/pdf');
    await sendDocumentById(phoneNumber, mediaId, SERNATUR_CERTIFICATE_FILENAME, caption);
    return;
  }

  const presignedUrl = await getPresignedUrl({ Bucket: bucket, Key: SERNATUR_CERTIFICATE_S3_KEY }, 3600);
  const url = await shortenUrl(presignedUrl);
  await sendMetaTextMessage(phoneNumber, `${caption} ${SERNATUR_CERTIFICATE_FILENAME}: ${url}`);
}
