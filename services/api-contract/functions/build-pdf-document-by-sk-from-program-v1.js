import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { buildDocumentData } from '../../../libs/contract/builder.js';
import { success, unsuccessful } from "../../../helpers/responses.js";
import { generateContract, loadImages } from '../../../libs/pdf-generator/index.js';

const {
  PROGRAM_TABLE,
  BUCKET_INFO_GI,
  DYNAMODB_PROGRAM_TABLE
} = process.env;

/**
 * Genera un documento PDF de contrato en formato base64 a partir de un SK de programa.
 *
 * @async
 * @function main
 * @param {Object} event - Objeto de evento de AWS Lambda
 * @param {Object} event.queryStringParameters - Parámetros de consulta de la petición
 * @param {string} event.queryStringParameters.sk - Sort key del programa en DynamoDB
 * @returns {Promise<Object>} Respuesta HTTP con el PDF en base64 o mensaje de error
 * @returns {number} return.statusCode - Código de estado HTTP (200, 400, 404, 500)
 * @returns {Object} return.body - Cuerpo de la respuesta
 * @returns {string} [return.body.base64] - PDF generado en formato base64 (en caso de éxito)
 * @returns {string} [return.body.message] - Mensaje de error (en caso de fallo)
 *
 * @throws {Error} Error 400 - Si falta el parámetro sk en la petición
 * @throws {Error} Error 404 - Si no se encuentra el programa o el contrato
 * @throws {Error} Error 500 - Si hay problemas con la configuración de S3 o la generación del PDF
 *
 * @description
 * Esta función realiza los siguientes pasos:
 * 1. Valida la presencia del parámetro sk
 * 2. Consulta el programa en DynamoDB usando pk y sk
 * 3. Extrae los datos del contrato del programa
 * 4. Construye los datos del documento de forma dinámica
 * 5. Carga las imágenes de encabezado y pie de página desde S3
 * 6. Genera el PDF del contrato
 * 7. Retorna el PDF codificado en base64
 */
export const main = async (event) => {
  const action = "Generar contrato pdf en base64.";

  try {
    const { sk } = event.pathParameters;
    const decodedSk = decodeURIComponent(sk);

    if (!decodedSk) return unsuccessful(400, { message: 'Falta el sk en la petición.' }, action);

    const params = {
      TableName: DYNAMODB_PROGRAM_TABLE,
      ReturnConsumedCapacity: 'TOTAL',
      KeyConditionExpression: '#pk = :pk AND #sk = :sk',
      ExpressionAttributeValues: {
        ':pk': PROGRAM_TABLE,
        ':sk': decodedSk,
      },
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sk': 'sk'
      }
    };

    const results = await dynamoDbLib.query(params);

    if (results.length === 0) return unsuccessful(404, { message: 'Programa no encontrado.' }, action);

    const document = results[0];

    const { contract } = document.content[0];

    if (!contract) return unsuccessful(404, { message: 'Documento no encontrado.' }, action);

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
