import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import * as dynamoDb from "../../../libs/dynamodb-v3.js";

const { DYNAMODB_MAINTAINER_TABLE } = process.env;
const CURRENT_YEAR = String(new Date().getFullYear());

/** PKs administrables por este endpoint. */
const ALLOWED_PKS = new Set(['COST_ITEM']);

/**
 * Obtiene TODOS los items de un catálogo (activos e inactivos) para uso administrativo.
 * A diferencia de /catalogo, este endpoint NO filtra por `active` y expone el precio del año actual.
 *
 * Query params:
 *  - pk (requerido) - Partition Key del catálogo (ej: 'COST_ITEM').
 */
const handler = async (event) => {
  const action = "Listar items del mantenedor (administración).";
  const pk = event.queryParams?.pk ?? '';

  if (!pk || !ALLOWED_PKS.has(pk)) {
    const error = new Error(`Catálogo no válido. Valores permitidos: ${[...ALLOWED_PKS].join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }

  const raw = await dynamoDb.query({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeNames: { "#pk": "pk" },
    ExpressionAttributeValues: { ":pk": pk },
  });

  const items = (raw ?? []).map(({ pk: _pk, createdAt, updatedAt, prices, ...rest }) => ({
    ...rest,
    price: prices?.[CURRENT_YEAR] ?? 0,
  }));

  return success(200, items, action);
};

export const main = standardMiddleware(handler);
