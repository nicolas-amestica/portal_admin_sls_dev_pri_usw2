import { buildDocumentData } from '../../../libs/contract/builder.js';
import { success, unsuccessful } from "../../../helpers/responses.js";
import { generatePDF, loadImages } from '../../../libs/pdf-generator/index.js';
import { parseEventBody } from '../../../helpers/event-parser.js';

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
  const action = "Generar documento pdf.";

  try {
    const body = parseEventBody(event);
    const { documentData } = body;

    if (!documentData) {
      return unsuccessful(400, { message: 'Falta el formulario del documento.' }, action);
    }

    if (!documentData.contract) {
      return unsuccessful(400, { message: 'Falta el contrato en el documento.' }, action);
    }

    // 2. Construir datos del documento dinámicamente
    const adaptedDocumentData = buildDocumentData(documentData.contract);

    // 3. Cargar imágenes desde S3
    if (!BUCKET_INFO_GI) {
      return unsuccessful(500, { message: 'Configuración de bucket S3 no disponible.' }, action);
    }

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
