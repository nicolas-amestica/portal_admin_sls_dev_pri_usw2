import bcrypt from "bcryptjs";
import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { resolvePromises } from "../../../helpers/allsettled";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_USER_TABLE } = process.env;

/**
 * Función principal para restablecer la contraseña de usuario usando un token de recuperación.
 */
const handler = async (event) => {
  console.log("Event ==>", event);
  const action = "Restablecimiento de contraseña.";
  const data = event.body;

  // Validar que se hayan proporcionado los datos requeridos
  if (!data.token) {
    const error = new Error('El token es requerido.');
    error.statusCode = 400;
    throw error;
  }

  if (!data.newPassword) {
    const error = new Error('La nueva contraseña es requerida.');
    error.statusCode = 400;
    throw error;
  }

  // Validar longitud mínima de la contraseña
  if (data.newPassword.length < 8) {
    const error = new Error('La contraseña debe tener al menos 8 caracteres.');
    error.statusCode = 400;
    throw error;
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

  const userPromise = dynamoDbLib.query(params);
  const [resultPromises] = await resolvePromises([userPromise]);

  // Validar que el usuario existe
  if (!resultPromises[0]) {
    console.log(`Token inválido o expirado: ${data.token}`);
    const error = new Error('Token inválido o expirado.');
    error.statusCode = 400;
    throw error;
  }

  const user = resultPromises[0];

  // Validar que el token no haya expirado
  const tokenExpiry = new Date(user.resetTokenExpiry);
  const now = new Date();

  if (now > tokenExpiry) {
    console.log(`Token expirado para usuario ${user.email}. Expiry: ${user.resetTokenExpiry}, Now: ${now.toISOString()}`);
    const error = new Error('El token ha expirado. Solicita un nuevo enlace de recuperación.');
    error.statusCode = 400;
    throw error;
  }

  // Validar que el usuario esté activo
  if (!user.isActive) {
    console.log(`Intento de restablecer contraseña para usuario desactivado: ${user.email}`);
    const error = new Error('Usuario desactivado.');
    error.statusCode = 403;
    throw error;
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

  console.log(`Contraseña actualizada exitosamente para usuario ${user.email}`);

  return success(200, {
    message: "Contraseña restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña."
  }, action);
};

export const main = standardMiddleware(handler);