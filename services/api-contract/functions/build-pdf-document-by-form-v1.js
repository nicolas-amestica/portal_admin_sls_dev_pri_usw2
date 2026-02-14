import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from "../../../helpers/responses.js";
import { generateDocument } from '../../../libs/document-generator.js';

const {
  BUCKET_INFO_GI
} = process.env;

/**
 * Lambda handler que genera un documento PDF genérico en formato base64.
 *
 * @async
 * @param {Object} event - Evento de entrada Lambda API Gateway
 * @param {Object} event.body - Cuerpo del evento (JSON string)
 * @param {string} event.body.scope - Tipo de documento (CTT, DBA, DBR)
 * @param {Object} event.body.form - Datos del formulario para generar el documento
 * @param {Object} [event.body.action] - Opciones de generación del documento
 * @param {boolean} [event.body.action.isPreview=false] - Si es true, agrega marca de agua "BORRADOR"
 * @param {boolean} [event.body.action.hasSigned=true] - Si es false, incluye firmas digitales desde S3
 * @param {boolean} [event.body.action.hasHeaderFooter=false] - Si es true, carga header.png y footer.png desde S3
 */
export const main = async (event) => {
  const logAction = "Generar documento PDF en base64";

  try {
    // 1. Parsear body del evento
    const body = parseEventBody(event);
    const { scope, document, action } = body;

    // 2. Validar configuración de bucket S3
    if (!BUCKET_INFO_GI) {
      return unsuccessful(500, {
        message: 'Configuración de bucket S3 no disponible.'
      }, logAction);
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
      return unsuccessful(result.statusCode || 500, {
        message: result.error,
        supportedScopes: result.supportedScopes
      }, logAction);
    }

  } catch (error) {
    console.error('Error en lambda build_document_by_form_v1:', error);
    return unsuccessful(500, {
      message: error.message || 'Error interno del servidor'
    }, logAction);
  }
};
