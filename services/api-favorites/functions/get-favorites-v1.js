import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_FAVORITES_TABLE } = process.env;
const ACTION = "Obtención de favoritos del usuario.";

/**
 * Obtiene todos los favoritos de un usuario filtrados por ámbito (scope).
 *
 * Diseño DynamoDB:
 * - PK: FAV#{userId}
 * - SK: FAV#{scope}#{id}  →  begins_with permite filtrar por scope sin scan
 */
const handler = async (event) => {
  const { userId } = event.pathParams;
  const { scope } = event.queryParams ?? {};

  if (!userId) {
    const error = new Error("El identificador de usuario es requerido.");
    error.statusCode = 400;
    throw error;
  }

  if (!scope) {
    const error = new Error("El ámbito (scope) es requerido.");
    error.statusCode = 400;
    throw error;
  }

  const params = {
    TableName: DYNAMODB_FAVORITES_TABLE,
    KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :skPrefix)",
    ExpressionAttributeNames: {
      "#pk": "pk",
      "#sk": "sk",
    },
    ExpressionAttributeValues: {
      ":pk": `FAV#${decodeURIComponent(userId)}`,
      ":skPrefix": `FAV#${scope}#`,
    },
  };

  const items = await dynamoDbLib.query(params);
  const sanitized = (items ?? []).map((item) => ({
    ...item,
    content: item.content?.map(({ rates, ...rest }) => rest) ?? [],
  }));

  return success(200, sanitized, ACTION);
};

export const main = standardMiddleware(handler);
