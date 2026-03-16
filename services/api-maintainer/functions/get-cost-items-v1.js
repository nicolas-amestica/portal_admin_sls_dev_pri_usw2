import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import * as dynamoDb from "../../../libs/dynamodb-v3.js";

const { DYNAMODB_MAINTAINER_TABLE } = process.env;

const PK_COST_ITEM = 'COST_ITEM';
const CURRENT_YEAR = String(new Date().getFullYear());

/**
 * Obtiene los items de costo activos del catálogo del mantenedor.
 * Filtra por `active = true` y retorna únicamente el precio del año actual.
 * Acepta un parámetro `search` (query string) para filtrar por nombre del servicio.
 */
const handler = async (event) => {
  const action = "Obtener items de costo activos del catálogo.";
  const search = (event.queryStringParameters?.search ?? '').toLowerCase().trim();

  const queryParams = {
    TableName: DYNAMODB_MAINTAINER_TABLE,
    KeyConditionExpression: "#pk = :pk",
    FilterExpression: "#active = :active",
    ExpressionAttributeNames: { "#pk": "pk", "#active": "active" },
    ExpressionAttributeValues: { ":pk": PK_COST_ITEM, ":active": true },
  };

  const raw = await dynamoDb.query(queryParams);

  let items = (raw ?? []).map(({ pk, active, createdAt, updatedAt, prices, ...rest }) => ({
    ...rest,
    price: prices?.[CURRENT_YEAR] ?? 0,
  }));

  if (search.length >= 3) {
    items = items.filter(item => item.label?.toLowerCase().includes(search));
  }

  return success(200, items, action);
};

export const main = standardMiddleware(handler);
