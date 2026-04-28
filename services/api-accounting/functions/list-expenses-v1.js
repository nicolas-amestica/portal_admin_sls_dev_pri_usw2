import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Listar gastos';

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

  const list = items ?? [];
  return success(200, { Items: list, Count: list.length }, ACTION, { periodo });
};

export const main = standardMiddleware(handler);
