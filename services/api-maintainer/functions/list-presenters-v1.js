import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import * as dynamoDb from "../../../libs/dynamodb-v3.js";

const { DYNAMODB_MAINTAINER_TABLE } = process.env;

/**
 * Lista todos los presentadores del mantenedor (activos e inactivos).
 * Usado por el módulo de agenda para seleccionar el anfitrión de una reunión
 * y por el módulo de configuración para administrarlos.
 */
const handler = async (_event) => {
  const action = "Listar presentadores.";

  const raw = await dynamoDb.query({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeNames: { "#pk": "pk" },
    ExpressionAttributeValues: { ":pk": "PRESENTER" },
  });

  const items = (raw ?? []).map(({ pk: _pk, ...rest }) => rest);

  return success(200, items, action);
};

export const main = standardMiddleware(handler);
