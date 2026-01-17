import { parseEventBody } from '../../../helpers/event-parser.js';
import { buildDocumentData } from '../../../libs/contract/builder.js';
import { success, unsuccessful } from "../../../helpers/responses.js";
import { generateContract, loadImages } from '../../../libs/pdf-generator/index.js';

const {
  BUCKET_INFO_GI
} = process.env;

/**
 * Función principal que genera un documento PDF de contrato en formato base64.
 *
 * @async
 * @param {Object} event - Evento de entrada que contiene el cuerpo de la petición con los datos del contrato.
 * @param {Object} event.body - Cuerpo del evento que debe contener el objeto contract.
 * @param {Object} event.body.contract - Objeto con los datos del contrato a procesar.
 * @returns {Promise<Object>} Objeto de respuesta con el PDF en formato base64.
 * @returns {number} return.statusCode - Código de estado HTTP de la respuesta (200 para éxito, 400/500 para errores).
 * @returns {Object} return.body - Cuerpo de la respuesta.
 * @returns {string} [return.body.base64] - PDF generado codificado en base64 (solo en caso de éxito).
 * @returns {string} [return.body.message] - Mensaje de error descriptivo (solo en caso de fallo).
 * @throws {Error} Retorna error 400 si falta el contrato en la petición.
 * @throws {Error} Retorna error 500 si la configuración del bucket S3 no está disponible.
 * @throws {Error} Retorna error 500 si el PDF generado no es un buffer válido.
 * @throws {Error} Retorna error 500 para cualquier otro error durante el proceso.
 *
 * @description
 * Esta función ejecuta los siguientes pasos:
 * 1. Parsea el cuerpo del evento para extraer los datos del contrato
 * 2. Construye los datos del documento de forma dinámica usando buildDocumentData()
 * 3. Carga las imágenes de encabezado y pie de página desde S3
 * 4. Genera el PDF usando la función generateContract()
 * 5. Retorna el PDF codificado en base64
 */
export const main = async (event) => {
  const action = "Generar contrato pdf en base64.";

  try {
    const body = parseEventBody(event);
    const { contract } = body;

    if (!contract) {
      return unsuccessful(400, { message: 'Falta el contrato en la petición.' }, action);
    }

    // 2. Construir datos del documento dinámicamente
    const adaptedDocumentData = buildDocumentData(contract);

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
    const pdfBuffer = await generateContract(adaptedDocumentData, headerImage, footerImage);

    if (!Buffer.isBuffer(pdfBuffer)) return unsuccessful(500, { message: "El PDF generado no es un buffer válido" }, action);

    return success(200, { base64: pdfBuffer.toString('base64') }, action);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, action);
  }
};
