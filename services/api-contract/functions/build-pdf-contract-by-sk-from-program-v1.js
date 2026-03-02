import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { generateDocument } from '../../../libs/document-builders/generator.js';
import { CachedDynamoDB, CacheKeys, cache } from '../../../libs/cache/index.js';

const {
  PROGRAM_TABLE,
  BUCKET_INFO_GI,
  DYNAMODB_PROGRAM_TABLE
} = process.env;

/**
 * Genera un documento PDF de contrato en formato base64 a partir de un SK de programa.
 * Implementa caché en dos niveles:
 *   1. PDF completo (base64) — evita query + generación (TTL: 15 min)
 *   2. Query DynamoDB del programa (TTL: 10 min)
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

  // Nivel 1: caché del PDF completo
  const pdfCacheKey = CacheKeys.contractPdf(decodedSk);
  const cachedPdf = cache.get(pdfCacheKey);
  if (cachedPdf !== null) {
    return success(200, { base64: cachedPdf }, action);
  }

  // Nivel 2: caché del query DynamoDB
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

  // Retornar respuesta según resultado y guardar PDF en caché
  if (result.success) {
    cache.set(pdfCacheKey, result.base64, CacheKeys.TTL.CONTRACT_PDF);
    return success(200, { base64: result.base64 }, action);
  } else {
    const error = new Error(result.error);
    error.statusCode = result.statusCode || 500;
    throw error;
  }
};

export const main = standardMiddleware(handler);
