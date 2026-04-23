import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Eliminar gasto';

/**
 * Handler: elimina un gasto registrado.
 * DELETE /v1/contabilidad/gastos/{sk}?userId=...
 */
const handler = async (event) => {
  const sk = decodeURIComponent(event.pathParameters?.sk ?? '');
  const { userId } = event.queryStringParameters || {};

  if (!sk || !userId) {
    const error = new Error('El sk (path) y userId (query) son requeridos.');
    error.statusCode = 400;
    throw error;
  }

  const result = await dynamoDbLib.remove({
    TableName: DYNAMODB_ACCOUNTING_TABLE,
    Key: { pk: `USR#${userId}`, sk },
  });

  return success(200, result, ACTION);
};

export const main = standardMiddleware(handler);
