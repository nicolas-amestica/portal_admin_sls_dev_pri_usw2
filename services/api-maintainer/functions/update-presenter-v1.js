import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import * as dynamoDb from "../../../libs/dynamodb-v3.js";

const { DYNAMODB_MAINTAINER_TABLE } = process.env;

/**
 * Actualiza un presentador existente del mantenedor.
 *
 * Body (JSON):
 *  - sk            (requerido) - Sort Key del presentador a actualizar.
 *  - content.name  (requerido) - Nombre completo del presentador.
 *  - description   (requerido) - Descripción del rol del presentador.
 *  - active        (requerido) - Estado activo del presentador.
 */
const handler = async (event) => {
  const action = "Actualizar presentador.";
  const { sk, content, description, active } = event.body ?? {};

  if (!sk || typeof sk !== "string") {
    const error = new Error('El campo "sk" es requerido.');
    error.statusCode = 400;
    throw error;
  }

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

  const updated = await dynamoDb.update({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    Key: { pk: "PRESENTER", sk },
    UpdateExpression: "SET #content = :content, #description = :description, #active = :active, #updatedAt = :updatedAt",
    ConditionExpression: "attribute_exists(sk)",
    ExpressionAttributeNames: {
      "#content": "content",
      "#description": "description",
      "#active": "active",
      "#updatedAt": "updatedAt",
    },
    ExpressionAttributeValues: {
      ":content": { name: content.name.trim() },
      ":description": description.trim(),
      ":active": Boolean(active),
      ":updatedAt": new Date().toISOString(),
    },
  });

  return success(200, updated, action);
};

export const main = standardMiddleware(handler);
