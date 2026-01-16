import { buildDocumentData } from '../../../libs/contract/builder.js';
import { success, unsuccessful } from "../../../helpers/responses.js";
// import { generatePDF, loadImages } from '../../../libs/pdf-generator/index.js';
import { generateContract, loadImages } from '../../../libs/pdf-generator/index.js';
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
  const action = "Generar contrato pdf en base64.";

  try {

    console.log(1);
    const body = parseEventBody(event);
    const { contract } = body;

    console.log(2);
    console.log(3);
    if (!contract) {
      return unsuccessful(400, { message: 'Falta el contrato en la petición.' }, action);
    }

    console.log(4);
    // 2. Construir datos del documento dinámicamente
    const adaptedDocumentData = buildDocumentData(contract);

    console.log(5);
    // 3. Cargar imágenes desde S3
    if (!BUCKET_INFO_GI) {
      return unsuccessful(500, { message: 'Configuración de bucket S3 no disponible.' }, action);
    }

    console.log(6);
    const { headerImage, footerImage } = await loadImages(
      BUCKET_INFO_GI,
      'assets/header.png',
      'assets/footer.png'
    );

    console.log(7);
    // 4. Generar PDF
    const pdfBuffer = await generateContract(adaptedDocumentData, headerImage, footerImage);

    console.log(8);
    if (!Buffer.isBuffer(pdfBuffer))
      return unsuccessful(500, { message: "El PDF generado no es un buffer válido" }, action);

    console.log(9);
    // 5. Retornar respuesta
    return success(200, { base64: pdfBuffer.toString('base64') }, action);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, action);
  }
};
