import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';
import { getAccountingPartitionPk } from '../helpers/accounting-keys.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Eliminar ingreso';

/**
 * Handler: elimina un ingreso registrado.
 * DELETE /v1/contabilidad/ingresos/{sk}
 */
const handler = async (event) => {
  const sk = decodeURIComponent(event.pathParameters?.sk ?? '');
  const partitionKey = getAccountingPartitionPk();

  if (!sk) {
    const error = new Error('El sk (path) es requerido.');
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
