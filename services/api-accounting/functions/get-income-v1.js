import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Obtener ingreso';

/**
 * Handler: obtiene un ingreso por su sk y userId.
 * GET /v1/contabilidad/ingresos/{sk}?userId=...
 */
const handler = async (event) => {
  const sk = decodeURIComponent(event.pathParameters?.sk ?? '');
  const { userId } = event.queryStringParameters || {};

  if (!sk || !userId) {
    const error = new Error('El sk (path) y userId (query) son requeridos.');
    error.statusCode = 400;
    throw error;
  }

  const item = await dynamoDbLib.getOne({
    TableName: DYNAMODB_ACCOUNTING_TABLE,
    Key: { pk: `USR#${userId}`, sk },
  });

  if (!item) {
    const error = new Error('Ingreso no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  return success(200, { Item: item }, ACTION);
};

export const main = standardMiddleware(handler);
