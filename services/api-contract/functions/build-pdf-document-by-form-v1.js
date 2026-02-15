import { standardMiddleware } from "../../../libs/middleware/index.js";
import { success } from "../../../helpers/responses.js";
import { generateDocument } from '../../../libs/document-generator.js';

const {
  BUCKET_INFO_GI
} = process.env;

/**
 * Lambda handler que genera un documento PDF genérico en formato base64.
 *
 * @async
 * @param {Object} event - Evento de entrada Lambda API Gateway
 * @param {Object} event.body - Cuerpo del evento (ya parseado por middleware)
 * @param {string} event.body.scope - Tipo de documento (CTT, DBA, DBR)
 * @param {Object} event.body.form - Datos del formulario para generar el documento
 * @param {Object} [event.body.action] - Opciones de generación del documento
 * @param {boolean} [event.body.action.isPreview=false] - Si es true, agrega marca de agua "BORRADOR"
 * @param {boolean} [event.body.action.hasSigned=true] - Si es false, incluye firmas digitales desde S3
 * @param {boolean} [event.body.action.hasHeaderFooter=false] - Si es true, carga header.png y footer.png desde S3
 */
const handler = async (event) => {
  const logAction = "Generar documento PDF en base64";

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
    form: document,
    action,
    bucket: BUCKET_INFO_GI
  });

  // 4. Retornar respuesta según resultado
  if (result.success) {
    return success(200, {
      base64: result.base64
    }, logAction);
  } else {
    const error = new Error(result.error);
    error.statusCode = result.statusCode || 500;
    error.supportedScopes = result.supportedScopes;
    throw error;
  }
};

export const main = standardMiddleware(handler);
