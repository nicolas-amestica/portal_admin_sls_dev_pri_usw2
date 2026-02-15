import { standardMiddleware } from "../../../libs/middleware/index.js";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success } from "../../../helpers/responses.js";
import { generateDocument } from '../../../libs/document-generator.js';

const {
  PROGRAM_TABLE,
  BUCKET_INFO_GI,
  DYNAMODB_PROGRAM_TABLE
} = process.env;

/**
 * Genera un documento PDF de contrato en formato base64 a partir de un SK de programa.
 *
 * @async
 * @function handler
 * @param {Object} event - Objeto de evento de AWS Lambda
 * @param {Object} event.pathParams - Parámetros de ruta (parseados por middleware)
 * @param {string} event.pathParams.sk - Sort key del programa en DynamoDB
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
const handler = async (event) => {
  const action = "Generar contrato pdf en base64.";

  const { sk } = event.pathParams;
  const decodedSk = decodeURIComponent(sk);

  if (!decodedSk) {
    const error = new Error('Falta el sk en la petición.');
    error.statusCode = 400;
    throw error;
  }

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

  if (results.length === 0) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const document = results[0];
  const { contract } = document.content[0];

  if (!contract) {
    const error = new Error('Documento no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  // Validar configuración de bucket S3
  if (!BUCKET_INFO_GI) {
    const error = new Error('Configuración de bucket S3 no disponible.');
    error.statusCode = 500;
    throw error;
  }

  // Generar documento usando el módulo central
  const result = await generateDocument({
    scope: 'CTT',
    form: contract,
    action: {
      isPreview: true,        // Con marca de agua (borrador)
      hasSigned: false,       // Con firmas digitales desde S3
      hasHeaderFooter: true   // Con header y footer
    },
    bucket: BUCKET_INFO_GI
  });

  // Retornar respuesta según resultado
  if (result.success) {
    return success(200, { base64: result.base64 }, action);
  } else {
    const error = new Error(result.error);
    error.statusCode = result.statusCode || 500;
    throw error;
  }
};

export const main = standardMiddleware(handler);
