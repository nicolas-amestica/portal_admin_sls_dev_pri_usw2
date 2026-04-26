import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { generateDocument } from '../../../libs/document-builders/generator.js';
import { uuidv7 } from 'uuidv7';
import * as S3 from "../../../libs/s3-v3.js";

const {
  BUCKET_INFO_GI
} = process.env;

/**
 * Lambda handler que genera un documento PDF genérico en formato base64.
 */
const handler = async (event) => {
  const logAction = "Generar documento PDF y subir a S3.";

  // 1. Obtener datos del body (ya parseado por middleware)
  const { scope, document, action } = event.body;

  // 2. Validar configuración de bucket S3
  if (!BUCKET_INFO_GI) {
    const error = new Error('Configuración de bucket S3 no disponible.');
    error.statusCode = 500;
    throw error;
  }

  // 3. Generar documento usando el módulo central
  const result = await generateDocument({
    scope,
    form: document.contract,
    action,
    bucket: BUCKET_INFO_GI
  });

  // 4. Subir PDF a S3 y retornar URL prefirmada
  if (result.success) {
    const pdfBuffer = Buffer.from(result.base64, 'base64');
    const key = `contratos/on-demand/${scope}/${uuidv7()}.pdf`;

    await S3.putObject({
      Bucket: BUCKET_INFO_GI,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    });

    const expiresIn = 900;
    const url = await S3.getPresignedUrl({ Bucket: BUCKET_INFO_GI, Key: key }, expiresIn);

    return success(200, { url, bucket: BUCKET_INFO_GI, key, expiresIn }, logAction);
  } else {
    const error = new Error(result.error);
    error.statusCode = result.statusCode || 500;
    error.supportedScopes = result.supportedScopes;
    throw error;
  }
};

export const main = standardMiddleware(handler);
