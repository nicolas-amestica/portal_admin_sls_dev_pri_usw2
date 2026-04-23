import { randomUUID } from '../../../libs/crypto.js';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Registrar ingreso';
const REQUIRED_FIELDS = ['userId', 'fecha', 'montoTotal', 'tipoDocumento', 'nombreCliente', 'concepto', 'medioPago', 'cuentaBancaria'];

/**
 * Construye el item de ingreso para DynamoDB a partir del body validado.
 *
 * @param {object} body - Campos del ingreso recibidos del frontend.
 * @returns {object} Item listo para insertar en DynamoDB.
 */
const buildIncome = (body) => {
  const id = randomUUID();
  const periodo = body.fecha.slice(0, 7);
  const now = new Date().toISOString();

  return {
    pk: `USR#${body.userId}`,
    sk: `ING#${body.fecha}#${id}`,
    gsiOne: `INCOME_PERIOD#${periodo}`,
    id,
    userId: body.userId,
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
    status: 'REGISTRADO',
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Handler: registra un ingreso recibido en cuenta bancaria.
 * POST /v1/contabilidad/ingresos
 */
const handler = async (event) => {
  const missing = REQUIRED_FIELDS.filter((f) => !event.body?.[f]);
  if (missing.length) {
    const error = new Error(`Campos requeridos faltantes: ${missing.join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }

  const item = buildIncome(event.body);
  const result = await dynamoDbLib.put({ TableName: DYNAMODB_ACCOUNTING_TABLE, Item: item });
  return success(201, result, ACTION);
};

export const main = standardMiddleware(handler);
