import { getObject } from "../../../libs/s3-v3";
import { success } from "../../../helpers/responses.js";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { cache, CacheKeys } from '../../../libs/cache/index.js';

const {
  PROGRAM_TABLE,
  DYNAMODB_PROGRAM_TABLE
} = process.env;

/**
 * Convierte un stream a Buffer
 */
const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

/**
 * Obtiene archivos PDF de un documento desde DynamoDB y S3, convirtiéndolos a base64.
 */
const handler = async (event) => {
  const action = "Obtener archivos PDF del documento.";

  const { sk } = event.queryParams;

  if (!sk) {
    const error = new Error('Falta el identificador del documento.');
    error.statusCode = 400;
    throw error;
  }

  const cacheKey = CacheKeys.contractPdf(sk);
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log('CACHE_HIT', { key: cacheKey });
    return success(200, cached, action);
  }

  console.log('CACHE_MISS', { key: cacheKey });

  const results = await dynamoDbLib.query({
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
  });

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

  cache.set(cacheKey, pdfDocuments, CacheKeys.TTL.CONTRACT_PDF);
  console.log('CACHE_SET', { key: cacheKey, ttl: `${CacheKeys.TTL.CONTRACT_PDF}ms` });

  return success(200, pdfDocuments, action);
};

export const main = standardMiddleware(handler);
