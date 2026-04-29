import { getPresignedUrl } from "../../../libs/s3-v3.js";
import { success } from "../../../helpers/responses.js";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { cache, CacheKeys } from '../../../libs/cache/index.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const CONTRACT_FILE_PRESIGN_SECONDS = 900;

const {
  PROGRAM_TABLE,
  DYNAMODB_PROGRAM_TABLE
} = process.env;

/**
 * Obtiene metadatos de archivos PDF de un contrato desde DynamoDB y URL GET prefirmada por archivo (sin cargar bytes en Lambda).
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

  let files = contract.files;

  if (!files || files.length === 0) {
    if (contract.file) {
      files = [contract.file];
    } else {
      const error = new Error('No se encontraron archivos en el contrato.');
      error.statusCode = 404;
      throw error;
    }
  }

  const legacy = event.queryParams?.legacy === '1' || event.queryParams?.legacy === 'true';

  /** @typedef {{ getObject?: Function }} FileRow */
  const pdfDocuments = await Promise.all(
    files.map(async (file) => {
      const s3Params = {
        Bucket: file.bucket,
        Key: `${file.path}/${file.Key}`
      };

      let base64PDF = '';
      if (legacy) {
        const { getObject } = await import('../../../libs/s3-v3.js');
        const pdfObject = await getObject(s3Params);
        const chunks = [];
        for await (const chunk of pdfObject.Body) {
          chunks.push(chunk);
        }
        base64PDF = Buffer.concat(chunks).toString('base64');
      }

      const previewUrl = await getPresignedUrl(s3Params, CONTRACT_FILE_PRESIGN_SECONDS);

      return {
        ...(legacy ? { base64: base64PDF } : {}),
        previewUrl,
        expiresIn: CONTRACT_FILE_PRESIGN_SECONDS,
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
