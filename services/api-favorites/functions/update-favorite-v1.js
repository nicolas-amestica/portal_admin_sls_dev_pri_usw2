import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_FAVORITES_TABLE } = process.env;
const ACTION = "Actualización de favorito.";

/**
 * Handler principal para actualizar un favorito existente.
 * Endpoint: PUT /v1/favoritos/{favoriteId}
 *
 * El body debe incluir: { id, userId, scope, name, content }
 * Con userId y scope se reconstruye pk/sk sin necesidad de GSI.
 */
const handler = async (event) => {
  const { favoriteId } = event.pathParams;
  const { userId, scope, name, content } = event.body;

  if (!favoriteId || !userId || !scope || !name) {
    const error = new Error("Los campos favoriteId, userId, scope y name son requeridos.");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(content) || content.length === 0) {
    const error = new Error("El contenido del favorito no puede estar vacío.");
    error.statusCode = 400;
    throw error;
  }

  const sanitizedContent = content.map(({ rates, ...rest }) => rest);

  const params = {
    TableName: DYNAMODB_FAVORITES_TABLE,
    Key: {
      pk: `FAV#${userId}`,
      sk: `FAV#${scope}#${favoriteId}`,
    },
    ConditionExpression: "attribute_exists(pk)",
    UpdateExpression: "SET #name = :name, #content = :content, #updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#name": "name",
      "#content": "content",
      "#updatedAt": "updatedAt",
    },
    ExpressionAttributeValues: {
      ":name": name,
      ":content": sanitizedContent,
      ":updatedAt": new Date().toISOString(),
    },
  };

  const result = await dynamoDbLib.update(params);

  if (!result) {
    const error = new Error("Favorito no encontrado.");
    error.statusCode = 404;
    throw error;
  }

  return success(200, result, ACTION);
};

export const main = standardMiddleware(handler);
