import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';
import { decodeAccountingPk } from '../helpers/resolve-partition-key.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Eliminar ingreso';

/**
 * Handler: elimina un ingreso registrado.
 * DELETE /v1/contabilidad/ingresos/{sk}?pk=USR%23...
 */
const handler = async (event) => {
  const sk = decodeURIComponent(event.pathParameters?.sk ?? '');
  const partitionKey = decodeAccountingPk(event.queryStringParameters?.pk);

  if (!sk || !partitionKey) {
    const error = new Error('El sk (path) y pk (query) son requeridos.');
    error.statusCode = 400;
    throw error;
  }

  const result = await dynamoDbLib.remove({
    TableName: DYNAMODB_ACCOUNTING_TABLE,
    Key: { pk: partitionKey, sk },
  });

  return success(200, result, ACTION);
};

export const main = standardMiddleware(handler);
