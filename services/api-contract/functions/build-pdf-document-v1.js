import { generatePDF, loadImages } from '../../../libs/pdf-generator/index.js';
import { buildDocumentData } from '../core/contract/builder.js';
import { success, unsuccessful } from "../../../helpers/responses.js";

const {
  BUCKET_INFO_GI
} = process.env;

/**
 * Handler principal para generar contratos en PDF
 *
 * @param {Object} event - Evento de API Gateway
 * @returns {Object} Respuesta con PDF en base64
 */
export const main = async (event) => {
  console.log("Event ==>", event);
  const action = "Generar documento pdf.";
  try {
    // 1. Validar parámetros
    const { documentData, type } = JSON.parse(event.body);

    if (!documentData) return unsuccessful(400, { message: 'Falta el formulario del documento.' }, action);
    if (!type) return unsuccessful(400, { message: 'Falta el tipo de respuesta del documento.' }, action);

    // 2. Construir datos del documento dinámicamente
    const adaptedDocumentData = buildDocumentData(documentData.contract);

    // 3. Cargar imágenes desde S3
    const { headerImage, footerImage } = await loadImages(
      BUCKET_INFO_GI,
      'assets/header.png',
      'assets/footer.png'
    );

    // 4. Generar PDF
    const pdfBuffer = await generatePDF(adaptedDocumentData, headerImage, footerImage);

    if (!Buffer.isBuffer(pdfBuffer))
      return unsuccessful(500, { message: "El PDF generado no es un buffer válido" }, action);

    // 5. Retornar respuesta
    return success(200, { base64: pdfBuffer.toString('base64') }, action);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, action);
  }
};
