import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import * as dynamoDb from "../../../libs/dynamodb-v3.js";

const { DYNAMODB_MAINTAINER_TABLE } = process.env;

/**
 * Crea un nuevo presentador en el mantenedor.
 *
 * Body (JSON):
 *  - content.name  (requerido) - Nombre completo del presentador (mínimo 2 caracteres).
 *  - description   (requerido) - Descripción del rol del presentador (mínimo 2 caracteres).
 *  - active        (opcional)  - Estado activo (default: true).
 */
const handler = async (event) => {
  const action = "Crear presentador.";
  const { content, description, active = true } = event.body ?? {};

  if (!content?.name || typeof content.name !== "string" || content.name.trim().length < 2) {
    const error = new Error('El campo "content.name" es requerido (mínimo 2 caracteres).');
    error.statusCode = 400;
    throw error;
  }

  if (!description || typeof description !== "string" || description.trim().length < 2) {
    const error = new Error('El campo "description" es requerido (mínimo 2 caracteres).');
    error.statusCode = 400;
    throw error;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const item = {
    pk: "PRESENTER",
    sk: `PRESENTER#${id}`,
    content: { name: content.name.trim() },
    description: description.trim(),
    active: Boolean(active),
    createdAt: now,
    updatedAt: now,
  };

  await dynamoDb.put({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    ConditionExpression: "attribute_not_exists(sk)",
    Item: item,
  });

  return success(201, item, action);
};

export const main = standardMiddleware(handler);
