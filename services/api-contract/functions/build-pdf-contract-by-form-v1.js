import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { generateDocumentBuffer } from '../../../libs/document-builders/generator.js';
import { publishContractPreviewPdf } from '../../../libs/document-builders/publish-contract-preview.js';

const {
  BUCKET_INFO_GI
} = process.env;

/**
 * Lambda handler que genera un documento PDF, lo sube a S3 y devuelve URL GET prefirmada para el visor.
 */
const handler = async (event) => {
  const logAction = "Generar documento PDF (URL prefirmada)";

  // 1. Obtener datos del body (ya parseado por middleware)
  const { scope, document, action } = event.body;

  // 2. Validar configuración de bucket S3
  if (!BUCKET_INFO_GI) {
    const error = new Error('Configuración de bucket S3 no disponible.');
    error.statusCode = 500;
    throw error;
  }

  // 3. Generar buffer y publicar vista previa (reutiliza getPresignedUrl / putObject de s3-v3)
  const generated = await generateDocumentBuffer({
    scope,
    form: document.contract,
    action,
    bucket: BUCKET_INFO_GI
  });

  if (!generated.success) {
    const error = new Error(generated.error);
    error.statusCode = generated.statusCode || 500;
    error.supportedScopes = generated.supportedScopes;
    throw error;
  }

  const preview = await publishContractPreviewPdf({
    bucket: BUCKET_INFO_GI,
    buffer: generated.buffer,
  });

  return success(200, preview, logAction);
};

export const main = standardMiddleware(handler);
