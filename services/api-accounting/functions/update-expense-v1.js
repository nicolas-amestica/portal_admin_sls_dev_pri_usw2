import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';
import { updateExpenseWithOptionalRelocate } from '../helpers/accounting-item-update.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Actualizar gasto';

/**
 * Handler: actualiza los campos editables de un gasto.
 * PUT /v1/contabilidad/gastos/{sk}
 */
const handler = async (event) => {
  const sk = decodeURIComponent(event.pathParameters?.sk ?? '');
  const updates = event.body ?? {};

  if (!sk) {
    const error = new Error('El sk (path) es requerido.');
    error.statusCode = 400;
    throw error;
  }

  const item = await updateExpenseWithOptionalRelocate({
    tableName: DYNAMODB_ACCOUNTING_TABLE,
    sk,
    updates,
  });

  return success(200, { Item: item }, ACTION);
};

export const main = standardMiddleware(handler);
