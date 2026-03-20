import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { success } from "../../../helpers/responses.js";
import * as dynamoDbLib from "../../../libs/dynamodb-v3.js";
import { getParameterValue } from "../../../libs/parameter-store.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_USER_TABLE, SECRET_KEY } = process.env;

/**
 * Decodifica y verifica el JWT del header Authorization.
 *
 * @param {string} authHeader - Header Authorization (Bearer <token>).
 * @param {string} secret - Clave secreta JWT.
 * @returns {Object} Payload decodificado del token.
 * @throws {Error} Si el header no existe o el token es inválido.
 */
const verifyToken = async (authHeader, secret) => {
  if (!authHeader?.startsWith("Bearer ")) {
    const error = new Error("No autorizado. Se requiere token de acceso.");
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, secret);
  } catch {
    const error = new Error("Token inválido o expirado.");
    error.statusCode = 401;
    throw error;
  }
};

/**
 * Obtiene el usuario de DynamoDB por su RUT (gsiOne).
 *
 * @param {string} gsiOne - RUT del usuario.
 * @returns {Promise<Object>} Usuario encontrado.
 * @throws {Error} Si el usuario no existe.
 */
const findUserByRut = async (gsiOne) => {
  const items = await dynamoDbLib.query({
    TableName: DYNAMODB_USER_TABLE,
    IndexName: "gsiOne-index",
    KeyConditionExpression: "#gsiOne = :gsiOne",
    ExpressionAttributeNames: { "#gsiOne": "gsiOne" },
    ExpressionAttributeValues: { ":gsiOne": gsiOne },
  });
  if (!items?.[0]) {
    const error = new Error("Usuario no encontrado.");
    error.statusCode = 404;
    throw error;
  }
  return items[0];
};

/**
 * Manejador para actualizar el perfil del usuario autenticado.
 *
 * Acepta dos operaciones mutuamente configurables:
 * - Actualización de datos personales: `fullName`, `phoneNumber`.
 * - Cambio de contraseña: `currentPassword` + `newPassword`.
 *
 * La ruta está protegida mediante JWT en el header Authorization.
 *
 * @param {Object} event - Evento Lambda con `body` y `headers`.
 * @returns {Object} Respuesta 200 con los campos actualizados.
 */
const handler = async (event) => {
  const action = "Actualización de perfil de usuario.";
  const { fullName, phoneNumber, currentPassword, newPassword } = event.body ?? {};
  const authHeader = event.headers?.authorization ?? event.headers?.Authorization;

  const secret = await getParameterValue(SECRET_KEY);
  const decoded = await verifyToken(authHeader, secret);
  const userRun = decoded.body?.userRun;

  if (!userRun) {
    const error = new Error("Token sin información de usuario.");
    error.statusCode = 401;
    throw error;
  }

  const user = await findUserByRut(userRun);

  const updateParts = [];
  const expressionValues = {};
  const expressionNames = {};

  // ── Actualizar datos personales ──────────────────────────────────────
  if (fullName?.trim()) {
    updateParts.push("#fullName = :fullName");
    expressionValues[":fullName"] = fullName.trim();
    expressionNames["#fullName"] = "fullName";
  }

  if (phoneNumber !== undefined) {
    updateParts.push("#phoneNumber = :phoneNumber");
    expressionValues[":phoneNumber"] = phoneNumber ?? "";
    expressionNames["#phoneNumber"] = "phoneNumber";
  }

  // ── Cambio de contraseña ─────────────────────────────────────────────
  if (currentPassword && newPassword) {
    if (!user.password) {
      const error = new Error("Este usuario no tiene contraseña configurada (acceso vía Google).");
      error.statusCode = 406;
      throw error;
    }
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      const error = new Error("La contraseña actual es incorrecta.");
      error.statusCode = 401;
      throw error;
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    updateParts.push("#password = :password");
    expressionValues[":password"] = hashed;
    expressionNames["#password"] = "password";
  }

  if (updateParts.length === 0) {
    const error = new Error("No se proporcionaron campos para actualizar.");
    error.statusCode = 400;
    throw error;
  }

  await dynamoDbLib.update({
    TableName: DYNAMODB_USER_TABLE,
    Key: { pk: user.pk, sk: user.sk },
    UpdateExpression: `SET ${updateParts.join(", ")}`,
    ExpressionAttributeValues: expressionValues,
    ExpressionAttributeNames: expressionNames,
  });

  return success(200, {
    fullName: fullName?.trim() ?? user.fullName,
    phoneNumber: phoneNumber ?? user.phoneNumber ?? "",
  }, action);
};

export const main = standardMiddleware(handler);
