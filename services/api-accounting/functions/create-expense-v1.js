import { randomUUID } from '../../../libs/crypto.js';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Registrar gasto';
const REQUIRED_FIELDS = ['userId', 'fecha', 'monto', 'categoria', 'tipoDocumento', 'nombreEmisor', 'motivoNegocio', 'tarjeta'];

/**
 * Construye el item de gasto para DynamoDB a partir del body validado.
 *
 * @param {object} body - Campos del gasto recibidos del frontend.
 * @returns {object} Item listo para insertar en DynamoDB.
 */
const buildExpense = (body) => {
  const id = randomUUID();
  const periodo = body.fecha.slice(0, 7);
  const now = new Date().toISOString();

  return {
    pk: `USR#${body.userId}`,
    sk: `EXP#${body.fecha}#${id}`,
    gsiOne: `EXPENSE_PERIOD#${periodo}`,
    id,
    userId: body.userId,
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
    receiptS3Key: body.receiptS3Key ?? '',
    conciliadoCartola: false,
    status: 'REGISTRADO',
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Handler: registra un gasto de empresa.
 * POST /v1/contabilidad/gastos
 */
const handler = async (event) => {
  const missing = REQUIRED_FIELDS.filter((f) => !event.body?.[f]);
  if (missing.length) {
    const error = new Error(`Campos requeridos faltantes: ${missing.join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }

  const item = buildExpense(event.body);
  const result = await dynamoDbLib.put({ TableName: DYNAMODB_ACCOUNTING_TABLE, Item: item });
  return success(201, result, ACTION);
};

export const main = standardMiddleware(handler);
