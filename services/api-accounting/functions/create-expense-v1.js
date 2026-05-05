import { randomUUID } from '../../../libs/crypto.js';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';
import {
  buildExpenseSortKey,
  getAccountingPartitionPk,
  gsiExpensePeriod,
  normalizeAuditUserId,
} from '../helpers/accounting-keys.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Registrar gasto';
const REQUIRED_FIELDS = [
  'fecha', 'monto', 'categoria', 'tipoDocumento', 'nombreEmisor', 'motivoNegocio', 'tarjeta',
];

/**
 * @description Normaliza comprobantes aceptando formato nuevo (receiptS3Keys) o legado (receiptS3Key).
 */
const normalizeReceiptKeys = (body) => {
  if (Array.isArray(body.receiptS3Keys)) {
    return [...new Set(body.receiptS3Keys.filter((key) => typeof key === 'string' && key.trim()).map((key) => key.trim()))];
  }

  if (typeof body.receiptS3Key === 'string' && body.receiptS3Key.trim()) {
    return [body.receiptS3Key.trim()];
  }

  return [];
};

/**
 * Construye el item de gasto para DynamoDB.
 *
 * @param {object} body - Campos del gasto.
 * @param {string} partitionKey - ACC#...
 * @param {string} userId - Usuario auditoría (opcional).
 * @returns {object}
 */
const buildExpense = (body, partitionKey, userId) => {
  const id = randomUUID();
  const periodo = body.fecha.slice(0, 7);
  const now = new Date().toISOString();
  const receiptS3Keys = normalizeReceiptKeys(body);
  const sk = buildExpenseSortKey({
    programSk: body.programSk,
    periodo,
    tipoDocumento: body.tipoDocumento,
    id,
  });

  return {
    pk: partitionKey,
    sk,
    gsiOne: gsiExpensePeriod(periodo),
    id,
    userId: userId || '',
    tipo: 'GASTO',
    fecha: body.fecha,
    periodo,
    monto: body.monto,
    montoNeto: body.montoNeto ?? body.monto,
    montoIVA: body.montoIVA ?? 0,
    categoria: body.categoria,
    subcategoria: body.subcategoria ?? '',
    tipoDocumento: body.tipoDocumento,
    folio: body.folio ?? '',
    rutEmisor: body.rutEmisor ?? '',
    nombreEmisor: body.nombreEmisor,
    motivoNegocio: body.motivoNegocio,
    tarjeta: body.tarjeta,
    personasInvitadas: body.personasInvitadas ?? [],
    receiptS3Keys,
    receiptS3Key: receiptS3Keys[0] ?? '',
    programSk: body.programSk,
    conciliadoCartola: false,
    status: 'REGISTRADO',
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Handler: registra un gasto de empresa.
 * POST /v1/contabilidad/gastos — body opcional userId (auditoría).
 */
const handler = async (event) => {
  const missing = REQUIRED_FIELDS.filter((f) => !event.body?.[f]);
  if (missing.length) {
    const error = new Error(`Campos requeridos faltantes: ${missing.join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }

  const partitionKey = getAccountingPartitionPk();
  const userId = normalizeAuditUserId(event.body?.userId);

  const item = buildExpense(event.body, partitionKey, userId);
  const result = await dynamoDbLib.put({ TableName: DYNAMODB_ACCOUNTING_TABLE, Item: item });
  return success(201, result, ACTION);
};

export const main = standardMiddleware(handler);
