import { uuidv7 } from "uuidv7";
import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_FAVORITES_TABLE } = process.env;
const ACTION = "Guardado de favorito.";

/**
 * Construye el item de favorito para almacenar en DynamoDB.
 *
 * @param {string} userId - Identificador del usuario (sk del usuario).
 * @param {string} scope  - Ámbito del favorito (ej: PROGRAM).
 * @param {string} name   - Nombre descriptivo del favorito.
 * @param {Array}  content - Contenido del formulario serializado.
 * @returns {Object} Item listo para insertar en DynamoDB.
 */
const buildFavorite = (userId, scope, name, content) => {
  const id = uuidv7();
  return {
    pk: `FAV#${userId}`,
    sk: `FAV#${scope}#${id}`,
    gsiOne: id,
    id,
    name,
    userId,
    scope,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Handler principal para guardar un nuevo favorito.
 * Endpoint: POST /v1/favoritos
 */
const handler = async (event) => {
  const { userId, scope, name, content } = event.body;

  if (!userId || !scope || !name) {
    const error = new Error("Los campos userId, scope y name son requeridos.");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(content) || content.length === 0) {
    const error = new Error("El contenido del favorito no puede estar vacío.");
    error.statusCode = 400;
    throw error;
  }

  const item = buildFavorite(userId, scope, name, content);
  const result = await dynamoDbLib.put({
    TableName: DYNAMODB_FAVORITES_TABLE,
    Item: item,
  });

  return success(200, result, ACTION);
};

export const main = standardMiddleware(handler);
