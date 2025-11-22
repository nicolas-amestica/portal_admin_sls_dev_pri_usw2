import bcrypt from "bcryptjs";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { resolvePromises } from "../../../helpers/allsettled";
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_USER_TABLE } = process.env;

/**
 * Función principal para restablecer la contraseña de usuario usando un token de recuperación.
 *
 * @async
 * @function
 * @param {Object} event - Objeto de evento recibido de API Gateway.
 * @param {string} event.body - Cuerpo de la solicitud en formato JSON, debe incluir `token` y `newPassword`.
 * @returns {Promise<Object>} Respuesta HTTP indicando éxito o error en el proceso.
 *
 * @throws {Object} Retorna un objeto de error con el código de estado HTTP correspondiente si ocurre algún problema.
 *
 * @description
 * Este método realiza el proceso de restablecimiento de contraseña:
 * 1. Valida que se hayan proporcionado el token y la nueva contraseña.
 * 2. Busca el usuario en DynamoDB usando el token de recuperación como índice secundario.
 * 3. Valida que el token no haya expirado (1 hora desde su generación).
 * 4. Valida que el usuario esté activo.
 * 5. Hashea la nueva contraseña usando bcrypt.
 * 6. Actualiza la contraseña del usuario y elimina el token de recuperación.
 * 7. Retorna confirmación del restablecimiento exitoso.
 */
export const main = async (event) => {
  // console.log(event);
  const action = "Restablecimiento de contraseña.";
  const data = JSON.parse(event.body);

  // Validar que se hayan proporcionado los datos requeridos
  if (!data.token) {
    return unsuccessful(400, { message: "El token es requerido." }, action);
  }

  if (!data.newPassword) {
    return unsuccessful(400, { message: "La nueva contraseña es requerida." }, action);
  }

  // Validar longitud mínima de la contraseña
  if (data.newPassword.length < 8) {
    return unsuccessful(400, { message: "La contraseña debe tener al menos 8 caracteres." }, action);
  }

  // Buscar usuario por token de recuperación usando índice secundario
  const params = {
    TableName: DYNAMODB_USER_TABLE,
    IndexName: "resetToken-index",
    ReturnConsumedCapacity: "TOTAL",
    KeyConditionExpression: "#resetToken = :resetToken",
    ExpressionAttributeValues: {
      ":resetToken": data.token,
    },
    ExpressionAttributeNames: {
      "#resetToken": "resetToken",
    },
  };

  try {
    const userPromise = dynamoDbLib.query(params);
    const [resultPromises] = await resolvePromises([userPromise]);

    // Validar que el usuario existe
    if (!resultPromises[0]) return unsuccessful(400, { message: "Token inválido o expirado." }, action);

    const user = resultPromises[0];

    // Validar que el token no haya expirado
    const tokenExpiry = new Date(user.resetTokenExpiry);
    const now = new Date();

    if (now > tokenExpiry) {
      console.log(`Token expirado para usuario ${user.gsiOne}. Expiry: ${user.resetTokenExpiry}, Now: ${now.toISOString()}`);
      return unsuccessful(400, { message: "El token ha expirado. Solicita un nuevo enlace de recuperación." }, action);
    }

    // Validar que el usuario esté activo
    if (!user.isActive) {
      console.log(`Intento de restablecer contraseña para usuario desactivado: ${user.gsiOne}`);
      return unsuccessful(403, { message: "Usuario desactivado." }, action);
    }

    // Hashear la nueva contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.newPassword, saltRounds);

    // Actualizar la contraseña y eliminar el token de recuperación
    const updateParams = {
      TableName: DYNAMODB_USER_TABLE,
      ReturnConsumedCapacity: "TOTAL",
      Key: {
        pk: user.pk,
        sk: user.sk,
      },
      UpdateExpression: "SET password = :password, updatedAt = :updatedAt REMOVE resetToken, resetTokenExpiry",
      ExpressionAttributeValues: {
        ":password": hashedPassword,
        ":updatedAt": new Date().toISOString(),
      },
    };

    await dynamoDbLib.update(updateParams);

    console.log(`Contraseña actualizada exitosamente para usuario ${user.gsiOne}`);

    return success(200, {
      message: "Contraseña restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña."
    }, action);
  } catch (e) {
    console.error("Error en restablecimiento de contraseña:", e);
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};
