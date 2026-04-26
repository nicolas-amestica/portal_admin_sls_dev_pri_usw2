import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { generateHtmlTemplatePdfBuffer } from '../../../libs/html-pdf/index.js';
import { uuidv7 } from 'uuidv7';
import * as S3 from '../../../libs/s3-v3.js';
import { validateHtmlDocumentPayload } from '../validators/validate-html-document-payload.js';

const { BUCKET_INFO_GI } = process.env;

/**
 * @description Genera un PDF desde plantilla HTML según scope (CTM, CTT, DBA, DBR) y sube el archivo a S3.
 */
const handler = async (event) => {
  const logAction = 'Generar PDF desde plantilla HTML y subir a S3.';
  const t0 = Date.now();

  const { scope, document, action } = validateHtmlDocumentPayload(event.body);

  if (!BUCKET_INFO_GI) {
    const error = new Error('Configuración de bucket S3 no disponible.');
    error.statusCode = 500;
    throw error;
  }

  const tGenerateStart = Date.now();
  const result = await generateHtmlTemplatePdfBuffer({ scope, document, action });
  const generateMs = Date.now() - tGenerateStart;

  if (!result.success) {
    const error = new Error(result.error);
    error.statusCode = result.statusCode || 500;
    throw error;
  }

  const pdfBuffer = result.buffer;
  const key = `documentos/html/${scope}/${uuidv7()}.pdf`;

  const tUploadStart = Date.now();
  await S3.putObject({
    Bucket: BUCKET_INFO_GI,
    Key: key,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
  });
  const uploadMs = Date.now() - tUploadStart;

  const tUrlStart = Date.now();
  const expiresIn = 900;
  const url = await S3.getPresignedUrl({ Bucket: BUCKET_INFO_GI, Key: key }, expiresIn);
  const presignMs = Date.now() - tUrlStart;
  const totalMs = Date.now() - t0;

  console.info('build_html_pdf_v1 timings', {
    scope,
    pdfBytes: pdfBuffer.length,
    generateMs,
    uploadMs,
    presignMs,
    totalMs,
  });

  return success(200, { url, bucket: BUCKET_INFO_GI, key, expiresIn, scope }, logAction);
};

export const main = standardMiddleware(handler);
