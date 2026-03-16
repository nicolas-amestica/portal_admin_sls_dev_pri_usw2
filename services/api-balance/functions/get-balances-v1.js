import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const {
  DYNAMODB_PROGRAM_TABLE,
  DYNAMODB_PAYMENT_TABLE,
  PROGRAM_TABLE_ID,
} = process.env;

/**
 * Consulta el programa para obtener el monto total con utilidades.
 */
const getProgramTotalWithUtilities = async (sk) => {
  const programs = await dynamoDbLib.query({
    TableName: DYNAMODB_PROGRAM_TABLE,
    KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': PROGRAM_TABLE_ID,
      ':sk': sk,
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
    },
  });
  return programs?.[0]?.content?.[0]?.totalWithUtilities ?? 0;
};

/**
 * Consulta los pagos AUTHORIZED de un programa usando el GSI sk-index.
 * Evita scan: usa KeyConditionExpression sobre el índice.
 */
const getAuthorizedPayments = (programId) =>
  dynamoDbLib.query({
    TableName: DYNAMODB_PAYMENT_TABLE,
    IndexName: 'sk-index',
    KeyConditionExpression: 'sk = :sk',
    FilterExpression: '#status = :status',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':sk': `PAY#${programId}`,
      ':status': 'AUTHORIZED',
    },
  });

/**
 * Ordena los pagos por número de cuota y calcula el saldo acumulativo restante.
 */
const buildBalanceRows = (totalWithUtilities, payments) => {
  const sorted = [...payments].sort(
    (a, b) => (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0),
  );
  let remaining = totalWithUtilities;
  return sorted.map((p) => {
    remaining -= p.amount;
    return {
      id: p.id,
      installmentNumber: p.installmentNumber,
      amount: p.amount,
      method: p.method ?? null,
      paidAt: p.paidAt ?? null,
      observation: p.observation ?? null,
      comprobante: p.comprobante ?? null,
      remaining,
      totalWithUtilities,
    };
  });
};

/**
 * Obtiene el historial de pagos AUTHORIZED de un programa desde la tabla de pagos.
 * Lee el total del programa para calcular el saldo pendiente acumulado.
 *
 * @example GET /v1/balances/{sk}
 */
const handler = async (event) => {
  const action = 'Obtención de historial de pagos del programa.';
  const { sk } = event.pathParams;

  if (!sk) {
    const error = new Error('Identificador de programa no válido.');
    error.statusCode = 400;
    throw error;
  }

  const [totalWithUtilities, rawPayments] = await Promise.all([
    getProgramTotalWithUtilities(sk),
    getAuthorizedPayments(sk),
  ]);

  const balanceRows = buildBalanceRows(totalWithUtilities, rawPayments ?? []);

  return success(200, balanceRows, action, { sk });
};

export const main = standardMiddleware(handler);
