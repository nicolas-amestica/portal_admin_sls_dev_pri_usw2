import { randomUUID } from '../../../libs/crypto.js';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';
import {
  buildIncomeSortKey,
  getAccountingPartitionPk,
  gsiIncomePeriod,
  normalizeAuditUserId,
} from '../helpers/accounting-keys.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Registrar ingreso';
const REQUIRED_FIELDS = [
  'fecha', 'montoTotal', 'tipoDocumento', 'nombreCliente', 'concepto',
  'medioPago', 'cuentaBancaria', 'programSk',
];

/**
 * Construye el item de ingreso para DynamoDB.
 *
 * @param {object} body
 * @param {string} partitionKey
 * @param {string} userId
 * @returns {object}
 */
const buildIncome = (body, partitionKey, userId) => {
  const id = randomUUID();
  const periodo = body.fecha.slice(0, 7);
  const now = new Date().toISOString();
  const sk = buildIncomeSortKey({
    programSk: body.programSk,
    periodo,
    tipoDocumento: body.tipoDocumento,
    id,
  });

  return {
    pk: partitionKey,
    sk,
    gsiOne: gsiIncomePeriod(periodo),
    id,
    userId: userId || '',
    tipo: 'INGRESO',
    fecha: body.fecha,
    periodo,
    montoTotal: body.montoTotal,
    montoNeto: body.montoNeto ?? body.montoTotal,
    montoIVA: body.montoIVA ?? 0,
    exentoIVA: body.exentoIVA ?? false,
    tipoDocumento: body.tipoDocumento,
    folio: body.folio ?? '',
    rutCliente: body.rutCliente ?? '',
    nombreCliente: body.nombreCliente,
    concepto: body.concepto,
    numeroCuota: body.numeroCuota ?? null,
    totalCuotas: body.totalCuotas ?? null,
    medioPago: body.medioPago,
    cuentaBancaria: body.cuentaBancaria,
    origenPago: body.origenPago ?? 'EXTERNO',
    conciliadoBancario: false,
    comprobantePagoS3Key: body.comprobantePagoS3Key ?? '',
    programSk: body.programSk,
    status: 'REGISTRADO',
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Handler: registra un ingreso recibido en cuenta bancaria.
 * POST /v1/contabilidad/ingresos — body opcional userId (auditoría).
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

  const programSkTrim = String(event.body.programSk ?? '').trim();
  event.body.programSk = programSkTrim;

  const item = buildIncome(event.body, partitionKey, userId);
  const result = await dynamoDbLib.put({ TableName: DYNAMODB_ACCOUNTING_TABLE, Item: item });
  return success(201, result, ACTION);
};

export const main = standardMiddleware(handler);
