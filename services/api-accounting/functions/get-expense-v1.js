import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';
import { getAccountingPartitionPk } from '../helpers/accounting-keys.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Obtener gasto';

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

  return success(200, { Item: normalizeExpense(item) }, ACTION);
};

export const main = standardMiddleware(handler);
