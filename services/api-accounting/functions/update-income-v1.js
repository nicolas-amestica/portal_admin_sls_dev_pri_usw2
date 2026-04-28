import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';
import { updateIncomeWithOptionalRelocate } from '../helpers/accounting-item-update.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Actualizar ingreso';

/**
 * Handler: actualiza los campos editables de un ingreso.
 * PUT /v1/contabilidad/ingresos/{sk}
 */
const handler = async (event) => {
  const sk = decodeURIComponent(event.pathParameters?.sk ?? '');
  const updates = event.body ?? {};

  if (!sk) {
    const error = new Error('El sk (path) es requerido.');
    error.statusCode = 400;
    throw error;
  }

  const item = await updateIncomeWithOptionalRelocate({
    tableName: DYNAMODB_ACCOUNTING_TABLE,
    sk,
    updates,
  });

  return success(200, { Item: item }, ACTION);
};

export const main = standardMiddleware(handler);
