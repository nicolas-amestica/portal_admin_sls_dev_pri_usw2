import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';
import { getAccountingPartitionPk } from '../helpers/accounting-keys.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Obtener gasto';

/**
 * Handler: obtiene un gasto por sk (path).
 * GET /v1/contabilidad/gastos/{sk}
 */
const handler = async (event) => {
  const sk = decodeURIComponent(event.pathParameters?.sk ?? '');
  const partitionKey = getAccountingPartitionPk();

  if (!sk) {
    const error = new Error('El sk (path) es requerido.');
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
