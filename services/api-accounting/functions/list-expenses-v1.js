import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Listar gastos';

/**
 * @description Normaliza comprobantes para exponer receiptS3Keys y receiptS3Key en forma consistente.
 */
const normalizeExpense = (item) => {
  const receiptS3Keys = Array.isArray(item.receiptS3Keys)
    ? [...new Set(item.receiptS3Keys.filter((key) => typeof key === 'string' && key.trim()).map((key) => key.trim()))]
    : (typeof item.receiptS3Key === 'string' && item.receiptS3Key.trim() ? [item.receiptS3Key.trim()] : []);

  return {
    ...item,
    receiptS3Keys,
    receiptS3Key: receiptS3Keys[0] ?? '',
  };
};

/**
 * Handler: lista gastos por período (todos, vía GSI).
 * GET /v1/contabilidad/gastos?periodo=YYYY-MM
 */
const handler = async (event) => {
  const { periodo } = event.queryStringParameters || {};

  if (!periodo) {
    const error = new Error('El parámetro periodo es requerido (formato YYYY-MM).');
    error.statusCode = 400;
    throw error;
  }

  const items = await dynamoDbLib.query({
    TableName: DYNAMODB_ACCOUNTING_TABLE,
    IndexName: 'gsiOne-index',
    KeyConditionExpression: 'gsiOne = :gsiOne',
    ExpressionAttributeValues: { ':gsiOne': `EXPENSE_PERIOD#${periodo}` },
    ScanIndexForward: false,
  });

  const list = (items ?? []).map(normalizeExpense);
  return success(200, { Items: list, Count: list.length }, ACTION, { periodo });
};

export const main = standardMiddleware(handler);
