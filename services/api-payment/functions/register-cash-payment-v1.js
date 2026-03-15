import { uuidv7 } from 'uuidv7';
import middy from '@middy/core';
import multipartBodyParser from '@middy/http-multipart-body-parser';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import * as S3 from '../../../libs/s3-v3.js';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { getAWSConfigs } from '../../../libs/configs.js';
import { errorHandlerMiddleware } from '../../../libs/middleware/error-handler.js';

const { DYNAMODB_PAYMENT_TABLE, DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE, BUCKET_INFO_GI } = process.env;

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Crea (y cachea) un DynamoDBDocumentClient con marshalling correcto
 * para operaciones sobre arrays de objetos en ExpressionAttributeValues.
 */
let _docClient;
const getDocClient = async () => {
  if (!_docClient) {
    const config = await getAWSConfigs();
    _docClient = DynamoDBDocumentClient.from(new DynamoDBClient(config));
  }
  return _docClient;
};

/**
 * Sube el comprobante de pago en efectivo a S3.
 * Valida la extensión del archivo antes de subir.
 */
const uploadComprobante = async ({ filename, content, contentType, paymentId }) => {
  const extension = filename?.split('.').pop()?.toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    const error = new Error(`Tipo de archivo no permitido. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const key = `comprobantes/efectivo/${paymentId}.${extension}`;

  await S3.putObject({
    Bucket: BUCKET_INFO_GI,
    Key: key,
    Body: content,
    ContentType: contentType || 'application/octet-stream',
  });

  return { key, extension };
};

/**
 * Registra un pago en efectivo para un programa con sii = false.
 *
 * Crea automáticamente la próxima cuota en la secuencia y la marca como pagada
 * en la misma operación. No requiere haber asignado la cuota previamente.
 *
 * Flujo:
 * 1. Valida el programa (existe y sii = false)
 * 2. Determina el próximo número de cuota (largo del array actual + 1)
 * 3. Agrega la nueva cuota a assignedInstallments con list_append atómico
 * 4. Sube el comprobante a S3 (comprobantes/efectivo/{uuid}.{ext})
 * 5. Crea el registro de pago con method=CASH y status=AUTHORIZED
 *
 * @example
 * POST /v1/pagos/admin/registrar-pago-efectivo
 * Body (multipart/form-data): { programId, amount, observation, paidAt, file }
 */
const handler = async (event) => {
  const action = 'Registrar pago en efectivo de cuota.';
  const { programId, amount, observation, paidAt, file } = event.body || {};

  if (!programId) {
    const error = new Error('El programId es requerido.');
    error.statusCode = 400;
    throw error;
  }

  const parsedAmount = Number(amount);
  if (!parsedAmount || parsedAmount < 1) {
    const error = new Error('El monto debe ser un número mayor a 0.');
    error.statusCode = 400;
    throw error;
  }

  if (!observation?.trim()) {
    const error = new Error('La observación es requerida.');
    error.statusCode = 400;
    throw error;
  }

  if (!paidAt) {
    const error = new Error('La fecha de pago es requerida.');
    error.statusCode = 400;
    throw error;
  }

  if (!file?.content) {
    const error = new Error('El comprobante de pago es requerido.');
    error.statusCode = 400;
    throw error;
  }

  const docClient = await getDocClient();

  // Lectura fuertemente consistente para obtener el estado real de assignedInstallments
  const { Item: program } = await docClient.send(new GetCommand({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE, sk: programId },
    ConsistentRead: true,
  }));

  if (!program) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  if (program.sii !== false) {
    const error = new Error('Solo se pueden registrar pagos en efectivo en programas con sii = false.');
    error.statusCode = 409;
    throw error;
  }

  const currentInstallments = Array.isArray(program.assignedInstallments)
    ? program.assignedInstallments
    : [];

  const installmentNumber = currentInstallments.length + 1;
  const now = new Date().toISOString();

  // Para pagos en efectivo el admin ingresa directamente el monto cobrado
  const newInstallment = {
    installmentNumber,
    amount: parsedAmount,
    surchargedAmount: parsedAmount,
    assignedAt: now,
  };

  // list_append atómico: añade al final sin reemplazar el array existente
  await docClient.send(new UpdateCommand({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE, sk: programId },
    UpdateExpression: 'SET assignedInstallments = list_append(if_not_exists(assignedInstallments, :empty), :new), updatedAt = :now',
    ExpressionAttributeValues: {
      ':new': [newInstallment],
      ':empty': [],
      ':now': now,
    },
  }));

  console.log(`[register-cash-payment] programa=${programId} cuota=${installmentNumber} monto=${parsedAmount}`);

  const paymentId = uuidv7();

  const { key: s3Key, extension } = await uploadComprobante({
    filename: file.filename,
    content: file.content,
    contentType: file.contentType || file.mimetype,
    paymentId,
  });

  await dynamoDbLib.put({
    TableName: DYNAMODB_PAYMENT_TABLE,
    Item: {
      pk: `PAY#${paymentId}`,
      sk: `PAY#${programId}`,
      id: paymentId,
      programId,
      installmentNumber,
      amount: parsedAmount,
      status: 'AUTHORIZED',
      method: 'CASH',
      observation: observation.trim(),
      paidAt,
      comprobante: {
        bucket: BUCKET_INFO_GI,
        key: s3Key,
        extension,
      },
      createdAt: now,
      updatedAt: now,
      gsiOne: `${programId}#INST#${installmentNumber}`,
    },
  });

  return success(200, { paymentId, programId, installmentNumber, amount: parsedAmount }, action);
};

export const main = middy(handler)
  .use(multipartBodyParser({
    busboy: {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    },
  }))
  .use(errorHandlerMiddleware());
