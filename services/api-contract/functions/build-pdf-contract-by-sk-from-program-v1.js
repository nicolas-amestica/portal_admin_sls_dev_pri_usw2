import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { generateDocument } from '../../../libs/document-builders/generator.js';
import { CachedDynamoDB, CacheKeys, cache } from '../../../libs/cache/index.js';
import { uuidv7 } from 'uuidv7';
import * as S3 from "../../../libs/s3-v3.js";

const {
  PROGRAM_TABLE,
  BUCKET_INFO_GI,
  DYNAMODB_PROGRAM_TABLE
} = process.env;

/**
 * Genera un documento PDF de contrato, lo sube a S3 y retorna una URL prefirmada.
 * Implementa caché en dos niveles:
 *   1. URL prefirmada — evita query + generación + upload (TTL: 15 min)
 *   2. Query DynamoDB del programa (TTL: 10 min)
 */
const handler = async (event) => {
  const action = "Generar contrato PDF y subir a S3.";

  const { sk } = event.pathParams;
  const decodedSk = decodeURIComponent(sk);

  if (!decodedSk) {
    const error = new Error('Falta el sk en la petición.');
    error.statusCode = 400;
    throw error;
  }

  // Nivel 1: caché de la URL prefirmada
  const pdfCacheKey = CacheKeys.contractPdf(decodedSk);
  const cachedPdf = cache.get(pdfCacheKey);
  if (cachedPdf !== null) {
    return success(200, cachedPdf, action);
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
  const { contract, sii } = document.content[0];

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

  // Seleccionar tipo de contrato según modalidad de pago:
  // CTM (pago en efectivo) cuando sii === false, CTT (transferencia/depósito) en caso contrario
  const contractScope = sii === false ? 'CTM' : 'CTT';

  // Generar documento usando el módulo central
  const result = await generateDocument({
    scope: contractScope,
    form: contract,
    action: {
      isPreview: true,        // Con marca de agua (borrador)
      hasSigned: false,       // Con firmas digitales desde S3
      hasHeaderFooter: true   // Con header y footer
    },
    bucket: BUCKET_INFO_GI
  });

  // Subir a S3, retornar URL prefirmada y guardar respuesta en caché
  if (result.success) {
    const pdfBuffer = Buffer.from(result.base64, 'base64');
    const key = `contratos/programas/${encodeURIComponent(decodedSk)}/${contractScope}/${uuidv7()}.pdf`;

    await S3.putObject({
      Bucket: BUCKET_INFO_GI,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    });

    const expiresIn = 900;
    const url = await S3.getPresignedUrl({ Bucket: BUCKET_INFO_GI, Key: key }, expiresIn);
    const payload = { url, bucket: BUCKET_INFO_GI, key, expiresIn, scope: contractScope, programSk: decodedSk };

    cache.set(pdfCacheKey, payload, CacheKeys.TTL.CONTRACT_PDF);
    return success(200, payload, action);
  } else {
    const error = new Error(result.error);
    error.statusCode = result.statusCode || 500;
    throw error;
  }
};

export const main = standardMiddleware(handler);
