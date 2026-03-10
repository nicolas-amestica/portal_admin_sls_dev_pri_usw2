import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_FAVORITES_TABLE } = process.env;
const ACTION = "Eliminación de favorito.";

/**
 * Busca el favorito en GSI1 (gsiOne-index) por su id único.
 * Retorna el item con pk y sk para poder eliminarlo directamente.
 *
 * @param {string} favoriteId - UUID del favorito.
 * @returns {Promise<Object|null>} Item encontrado o null.
 */
const findByFavoriteId = async (favoriteId) => {
  const params = {
    TableName: DYNAMODB_FAVORITES_TABLE,
    IndexName: "gsiOne-index",
    KeyConditionExpression: "#gsiOne = :gsiOne",
    ExpressionAttributeNames: { "#gsiOne": "gsiOne" },
    ExpressionAttributeValues: { ":gsiOne": favoriteId },
    Limit: 1,
  };

  const items = await dynamoDbLib.query(params);
  return items?.[0] ?? null;
};

/**
 * Handler principal para eliminar un favorito por su identificador.
 * Endpoint: DELETE /v1/favoritos/{favoriteId}
 *
 * Flujo:
 * 1. Query GSI1 (gsiOne-index) por favoriteId → obtiene pk y sk.
 * 2. DeleteItem por pk+sk (clave primaria) → sin scan.
 */
const handler = async (event) => {
  const { favoriteId } = event.pathParams;

  if (!favoriteId) {
    const error = new Error("El identificador del favorito es requerido.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await findByFavoriteId(favoriteId);

  if (!existing) {
    const error = new Error("Favorito no encontrado.");
    error.statusCode = 404;
    throw error;
  }

  const result = await dynamoDbLib.remove({
    TableName: DYNAMODB_FAVORITES_TABLE,
    Key: {
      pk: existing.pk,
      sk: existing.sk,
    },
  });

  return success(200, result ?? { favoriteId }, ACTION);
};

export const main = standardMiddleware(handler);
