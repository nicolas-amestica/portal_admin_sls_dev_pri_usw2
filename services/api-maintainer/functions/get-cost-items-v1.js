import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import * as dynamoDb from "../../../libs/dynamodb-v3.js";

const { DYNAMODB_MAINTAINER_TABLE } = process.env;

const CURRENT_YEAR = String(new Date().getFullYear());

/**
 * PKs permitidas en el catálogo del mantenedor.
 * Agrega aquí nuevas entradas a medida que se incorporen catálogos.
 */
const ALLOWED_PKS = new Set(['COST_ITEM']);

/**
 * Obtiene items activos del catálogo del mantenedor según la Partition Key recibida.
 * Filtra por `active = true` y retorna solo el precio del año actual (cuando aplica).
 *
 * Query params:
 *  - pk     (requerido) - Partition Key del catálogo (ej: 'COST_ITEM').
 *  - search (opcional)  - Término de búsqueda sobre el campo `label` (mínimo 3 chars).
 */
const handler = async (event) => {
  const action = "Obtener items activos del catálogo del mantenedor.";
  const pk = event.queryStringParameters?.pk ?? '';
  const search = (event.queryStringParameters?.search ?? '').toLowerCase().trim();

  if (!pk || !ALLOWED_PKS.has(pk)) {
    const error = new Error(`Catálogo no válido. Valores permitidos: ${[...ALLOWED_PKS].join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }

  const queryParams = {
    TableName: DYNAMODB_MAINTAINER_TABLE,
    KeyConditionExpression: "#pk = :pk",
    FilterExpression: "#active = :active",
    ExpressionAttributeNames: { "#pk": "pk", "#active": "active" },
    ExpressionAttributeValues: { ":pk": pk, ":active": true },
  };

  const raw = await dynamoDb.query(queryParams);

  let items = (raw ?? []).map(({ pk: _pk, active, createdAt, updatedAt, prices, ...rest }) => ({
    ...rest,
    ...(prices !== undefined ? { price: prices?.[CURRENT_YEAR] ?? 0 } : {}),
  }));

  if (search.length >= 3) {
    items = items.filter(item => item.label?.toLowerCase().includes(search));
  }

  return success(200, items, action);
};

export const main = standardMiddleware(handler);
