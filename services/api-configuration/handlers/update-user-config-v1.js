import * as dynamoDbLib from "../../../libs/dynamodb-v3.js";
import { success, unsuccessful } from "../../../helpers/responses.js";
import { validateUserConfig } from "../validators/validate-user-config.js";

const { DYNAMODB_USER_TABLE } = process.env;
const ACTION = "Actualizar configuración de usuario";

/**
 * Handler para actualizar configuración de usuario.
 *
 * @async
 * @function main
 * @param {Object} event - AWS Lambda event.
 * @param {string} event.body - JSON string con language.
 * @param {Object} event.requestContext - Request context con authorizer.
 * @returns {Promise<Object>} HTTP response.
 *
 * @description
 * Flujo:
 * 1. Parsear body del evento.
 * 2. Validar payload (language).
 * 3. Obtener userId del contexto de autorización.
 * 4. Actualizar registro de usuario con userConfig.
 * 5. Retornar respuesta normalizada.
 */
export const main = async (event) => {
  try {
    const data = JSON.parse(event.body);

    // Validar payload
    validateUserConfig(data);

    const { language } = data;

    // Obtener información del usuario desde el contexto
    // Nota: Esto depende de cómo esté configurado el authorizer
    // Por ahora, asumimos que viene en requestContext.authorizer
    const userContext = event.requestContext?.authorizer;

    if (!userContext?.pk || !userContext?.sk) {
      const error = new Error("Usuario no autenticado o contexto inválido.");
      error.statusCode = 401;
      throw error;
    }

    // Actualizar configuración del usuario
    const params = {
      TableName: DYNAMODB_USER_TABLE,
      ReturnConsumedCapacity: "TOTAL",
      Key: {
        pk: userContext.pk,
        sk: userContext.sk,
      },
      UpdateExpression: "SET userConfig = :userConfig, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":userConfig": { language },
        ":updatedAt": new Date().toISOString(),
      },
    };

    await dynamoDbLib.update(params);

    return success(
      200,
      {
        success: true,
        message: "Configuración de usuario actualizada correctamente",
      },
      ACTION,
    );
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return unsuccessful(statusCode, error, ACTION);
  }
};
