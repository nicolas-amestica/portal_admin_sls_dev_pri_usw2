import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import * as dynamoDb from "../../../libs/dynamodb-v3.js";

const { DYNAMODB_MAINTAINER_TABLE } = process.env;

/** PKs administrables por este endpoint. */
const ALLOWED_PKS = new Set(['COST_ITEM']);

/**
 * Elimina permanentemente un item del catálogo del mantenedor.
 *
 * Query params:
 *  - pk (requerido) - Partition Key del catálogo (ej: 'COST_ITEM').
 *  - sk (requerido) - Sort Key del item a eliminar.
 */
const handler = async (event) => {
  const action = "Eliminar item del mantenedor.";
  const pk = event.queryParams?.pk ?? '';
  const sk = event.queryParams?.sk ?? '';

  if (!pk || !ALLOWED_PKS.has(pk) || !sk) {
    const error = new Error('Los parámetros "pk" y "sk" son requeridos y válidos.');
    error.statusCode = 400;
    throw error;
  }

  const deleted = await dynamoDb.remove({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    Key: { pk, sk },
  });

  if (!deleted) {
    const error = new Error('Item no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  return success(200, { success: true, message: 'Item eliminado correctamente.' }, action);
};

export const main = standardMiddleware(handler);
