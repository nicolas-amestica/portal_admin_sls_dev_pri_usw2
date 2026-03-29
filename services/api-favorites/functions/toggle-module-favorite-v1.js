import { success } from "../../../helpers/responses.js";
import * as dynamoDbLib from "../../../libs/dynamodb-v3.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_FAVORITES_TABLE } = process.env;
const ACTION = "Toggle de módulo favorito.";
const SK = "FAV#MODULE_MENU";

/**
 * Agrega o elimina un módulo del set de favoritos del menú principal para un usuario.
 *
 * Diseño DynamoDB (1 ítem por usuario, máximo 1 WCU por operación):
 *   PK: FAV#{email}
 *   SK: FAV#MODULE_MENU
 *   moduleOptions: StringSet — contiene los SKs de módulos favoritos
 *
 * - isFavorite = true  → ADD el option al StringSet (crea el ítem si no existe)
 * - isFavorite = false → DELETE el option del StringSet
 *
 * Ambas operaciones son atómicas y no requieren leer antes de escribir.
 *
 * @param {string} event.body.email       - Email del usuario autenticado.
 * @param {string} event.body.option      - SK del módulo (Access.option) a togglear.
 * @param {boolean} event.body.isFavorite - true = agregar, false = quitar.
 */
const handler = async (event) => {
  const { email, option, isFavorite } = event.body;

  if (!email || !option || typeof isFavorite !== "boolean") {
    const error = new Error("Los campos email, option e isFavorite son requeridos.");
    error.statusCode = 400;
    throw error;
  }

  const pk = `FAV#${email}`;

  if (isFavorite) {
    // Agregar al set. Si el ítem no existe, se crea automáticamente con set_if_not_exists.
    await dynamoDbLib.update({
      TableName: DYNAMODB_FAVORITES_TABLE,
      Key: { pk, sk: SK },
      UpdateExpression: "ADD moduleOptions :opt SET updatedAt = :now",
      ExpressionAttributeValues: {
        ":opt": new Set([option]),
        ":now": new Date().toISOString(),
      },
    });
  } else {
    // Eliminar del set. Si el set queda vacío, el atributo desaparece (DynamoDB lo gestiona).
    await dynamoDbLib.update({
      TableName: DYNAMODB_FAVORITES_TABLE,
      Key: { pk, sk: SK },
      UpdateExpression: "DELETE moduleOptions :opt SET updatedAt = :now",
      ConditionExpression: "attribute_exists(pk)",
      ExpressionAttributeValues: {
        ":opt": new Set([option]),
        ":now": new Date().toISOString(),
      },
    });
  }

  return success(200, { email, option, isFavorite }, ACTION);
};

export const main = standardMiddleware(handler);
