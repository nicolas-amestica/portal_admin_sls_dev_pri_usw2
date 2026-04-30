import { uuidv7 } from 'uuidv7';
import { success } from '../../../helpers/responses.js';
import { putPresignedUrl } from '../../../libs/s3-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';

const EXPIRES_IN = 300;
const PDF = 'application/pdf';
const ACTION = 'Generar URL de subida para contrato firmado.';

const { BUCKET_INFO_GI } = process.env;

/**
 * @description Expone una URL prefirmada PUT para subir el PDF del contrato firmado directo a S3
 * (prefijo `contratos/pending/`). El front luego llama a aprobar pasando `signedContract.s3Key`.
 */
const handler = async (event) => {
  const { mimeType } = event.body || {};
  const normalized = (mimeType || PDF).toLowerCase().trim();

  if (normalized !== PDF) {
    const error = new Error('Solo se permiten archivos PDF.');
    error.statusCode = 400;
    throw error;
  }

  const s3Key = `contratos/pending/${uuidv7()}.pdf`;
  const uploadUrl = await putPresignedUrl(
    { Bucket: BUCKET_INFO_GI, Key: s3Key, ContentType: PDF },
    EXPIRES_IN
  );

  return success(200, { uploadUrl, s3Key }, ACTION);
};

export const main = standardMiddleware(handler);
