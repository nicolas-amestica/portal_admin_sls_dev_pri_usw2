import { getObject } from "../../../libs/s3-v3";
import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { CachedDynamoDB, CacheKeys, CacheMetrics } from "../../../libs/cache/index.js";

const {
  PROGRAM_TABLE,
  DYNAMODB_PROGRAM_TABLE
} = process.env;

/**
 * Convierte un stream a Buffer
 * @param {ReadableStream} stream - Stream del objeto S3
 * @returns {Promise<Buffer>} Buffer con el contenido del archivo
 */
const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

/**
 * Obtiene los archivos PDF de un documento de contrato desde S3 y los convierte a base64.
 * 
 * La función realiza las siguientes operaciones:
 * 1. Valida que se proporcione el identificador del documento (sk)
 * 2. Consulta la metadata del documento en DynamoDB con soporte de caché
 * 3. Extrae los archivos del contrato (soporta formato nuevo 'files' y antiguo 'file')
 * 4. Descarga cada archivo PDF desde S3
 * 5. Convierte los PDFs a base64 para su transmisión
 * 6. Retorna un array con los documentos codificados en base64
 * 
 * @async
 * @function handler
 * @param {Object} event - Evento de entrada de AWS Lambda
 * @param {Object} event.queryParams - Parámetros de query de la solicitud
 * @param {string} event.queryParams.sk - Identificador único del documento (requerido)
 * @param {Object} context - Contexto de ejecución de AWS Lambda
 * @param {string} context.requestId - ID de la solicitud
 * 
 * @returns {Promise<Object>} Objeto de respuesta con status 200 y array de PDFs en base64
 * @returns {Promise<Object>} return[].base64 - Contenido del PDF codificado en base64
 * @returns {Promise<Object>} return[].fileName - Nombre del archivo
 * @returns {Promise<Object>} return[].uploadDate - Fecha de carga del archivo
 * @returns {Promise<Object>} return[].type - Tipo de documento
 * @returns {Promise<Object>} return[].description - Descripción del archivo
 * 
 * @throws {Error} Error 400 si falta el parámetro 'sk'
 * @throws {Error} Error 404 si el programa no se encuentra en DynamoDB
 * @throws {Error} Error 404 si no existe contrato en el documento
 * @throws {Error} Error 404 si no se encuentran archivos en el contrato
 * @throws {Error} Error si falla la descarga desde S3 o la conversión a base64
 */
const handler = async (event, context) => {
  const action = "Obtener archivos PDF del documento.";

  const { sk } = event.queryParams;

  if (!sk) {
    const error = new Error('Falta el identificador del documento.');
    error.statusCode = 400;
    throw error;
  }

  // Cachear metadata del documento (no los PDFs de S3)
  const cacheKey = CacheKeys.contractPdf(sk);
  const params = {
    TableName: DYNAMODB_PROGRAM_TABLE,
    ReturnConsumedCapacity: 'TOTAL',
    KeyConditionExpression: '#pk = :pk AND #sk = :sk',
    ExpressionAttributeValues: {
      ':pk': PROGRAM_TABLE,
      ':sk': sk,
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk'
    }
  };

  const results = await CachedDynamoDB.query(
    params,
    cacheKey,
    CacheKeys.TTL.CONTRACT_PDF
  );

  if (!results || results.length === 0) {
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

  // Intentar obtener archivos del array files (nuevo formato)
  let files = contract.files;

  // Fallback: si no existe el array files, usar el objeto file singular (formato antiguo)
  if (!files || files.length === 0) {
    if (contract.file) {
      files = [contract.file];
    } else {
      const error = new Error('No se encontraron archivos en el contrato.');
      error.statusCode = 404;
      throw error;
    }
  }

  // Descargar todos los archivos PDF desde S3 y convertirlos a base64
  const pdfDocuments = await Promise.all(
    files.map(async (file) => {
      const s3Params = {
        Bucket: file.bucket,
        Key: `${file.path}/${file.Key}`
      };

      const pdfObject = await getObject(s3Params);
      const pdfBuffer = await streamToBuffer(pdfObject.Body);
      const base64PDF = pdfBuffer.toString('base64');

      return {
        base64: base64PDF,
        fileName: file.Key,
        uploadDate: file.uploadDate,
        type: file.type || 'unknown',
        description: file.description || ''
      };
    })
  );

  // Log de estadísticas del caché
  CacheMetrics.logDetailedStats('get-pdf-document-by-sk-v1', context);

  return success(200, pdfDocuments, action);
};

export const main = standardMiddleware(handler);