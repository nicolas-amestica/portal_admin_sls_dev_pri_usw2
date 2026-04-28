import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';
import { decodeAccountingPk } from '../helpers/resolve-partition-key.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Obtener gasto';

/**
 * Handler: obtiene un gasto por sk y pk (query).
 * GET /v1/contabilidad/gastos/{sk}?pk=USR%23...
 */
const handler = async (event) => {
  const sk = decodeURIComponent(event.pathParameters?.sk ?? '');
  const partitionKey = decodeAccountingPk(event.queryStringParameters?.pk);

  if (!sk || !partitionKey) {
    const error = new Error('El sk (path) y pk (query, partition key USR#...) son requeridos.');
    error.statusCode = 400;
    throw error;
  }

  const item = await dynamoDbLib.getOne({
    TableName: DYNAMODB_ACCOUNTING_TABLE,
    Key: { pk: partitionKey, sk },
  });

  if (!item) {
    const error = new Error('Gasto no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  return success(200, { Item: item }, ACTION);
};

export const main = standardMiddleware(handler);
