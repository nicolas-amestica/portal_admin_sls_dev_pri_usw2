import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { generateDocumentBuffer } from '../../../libs/document-builders/generator.js';
import { publishContractPreviewPdf } from '../../../libs/document-builders/publish-contract-preview.js';
import { CachedDynamoDB, CacheKeys, cache } from '../../../libs/cache/index.js';

const {
  PROGRAM_TABLE,
  BUCKET_INFO_GI,
  DYNAMODB_PROGRAM_TABLE
} = process.env;

/**
 * Genera un PDF de contrato desde el programa (SK), lo publica en S3 y devuelve URL GET prefirmada.
 * Mantiene caché en dos niveles: respuesta completa (prefirmada) y query DynamoDB del programa.
 */
const handler = async (event) => {
  const action = "Generar contrato PDF (URL prefirmada desde programa).";

  const { sk } = event.pathParams;
  const decodedSk = decodeURIComponent(sk);

  if (!decodedSk) {
    const error = new Error('Falta el sk en la petición.');
    error.statusCode = 400;
    throw error;
  }

  const pdfCacheKey = CacheKeys.contractPdf(decodedSk);
  const cachedPayload = cache.get(pdfCacheKey);
  if (cachedPayload !== null) {
    try {
      const parsed = typeof cachedPayload === 'string' ? JSON.parse(cachedPayload) : cachedPayload;
      if (parsed?.previewUrl) {
        return success(200, parsed, action);
      }
    } catch {
      // caché legacy en base64: regenerar
    }
  }

  const queryParams = {
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

  const results = await CachedDynamoDB.query(queryParams, CacheKeys.program(decodedSk), CacheKeys.TTL.PROGRAM);

  if (results.length === 0) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const document = results[0];
  const { contract, sii } = document.content[0];

  if (!contract) {
    const error = new Error('Documento no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  if (!BUCKET_INFO_GI) {
    const error = new Error('Configuración de bucket S3 no disponible.');
    error.statusCode = 500;
    throw error;
  }

  const contractScope = sii === false ? 'CTM' : 'CTT';

  const generated = await generateDocumentBuffer({
    scope: contractScope,
    form: contract,
    action: {
      isPreview: true,
      hasSigned: false,
      hasHeaderFooter: true
    },
    bucket: BUCKET_INFO_GI
  });

  if (!generated.success) {
    const error = new Error(generated.error);
    error.statusCode = generated.statusCode || 500;
    throw error;
  }

  const preview = await publishContractPreviewPdf({
    bucket: BUCKET_INFO_GI,
    buffer: generated.buffer,
  });

  /** Compat opcional con clientes que aún lean `base64` (no recomendado en API Gateway). */
  const legacyQuery = event.queryParams?.legacy === '1' || event.queryParams?.legacy === 'true';
  const responsePayload = legacyQuery
    ? {
        ...preview,
        base64: generated.buffer.toString('base64'),
      }
    : preview;

  cache.set(pdfCacheKey, JSON.stringify(responsePayload), CacheKeys.TTL.CONTRACT_PDF);
  return success(200, responsePayload, action);
};

export const main = standardMiddleware(handler);
