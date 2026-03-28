import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { resolveUserSession } from "./access-profile.js";
import { success } from "../../../helpers/responses.js";
import * as dynamoDbLib from "../../../libs/dynamodb-v3.js";
import { getParameterValue } from "../../../libs/parameter-store.js";
import { getGlobalConfig } from "../../../helpers/get-global-config.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_USER_TABLE, DYNAMODB_CONFIG_TABLE, SECRET_KEY } = process.env;
const APP_USERS_PK = 'APP#USERS';

/**
 * Genera un token JWT firmado con los datos proporcionados y una clave secreta.
 *
 * @param {Object} body - Payload del token.
 * @param {string} SECRET - Clave secreta para firmar.
 * @returns {string} Token JWT.
 */
const generateToken = (body, SECRET) => {
  return jwt.sign({ body }, SECRET, { expiresIn: "3d" });
};

/**
 * Inicia sesión de usuario validando credenciales y resolviendo accesos IAM.
 * Flujo: buscar usuario → validar contraseña → resolver accesos IAM → generar JWT.
 */
const handler = async (event) => {
  console.log("Event ==>", event);
  const SECRET = await getParameterValue(SECRET_KEY);
  const action = "Identificación de usuario.";
  const data = event.body;

  const items = await dynamoDbLib.query({
    TableName: DYNAMODB_USER_TABLE,
    IndexName: "email-index",
    KeyConditionExpression: "#email = :email",
    FilterExpression: "begins_with(pk, :pkPrefix)",
    ExpressionAttributeNames: { "#email": "email" },
    ExpressionAttributeValues: { ":email": data.email?.trim()?.toLowerCase(), ":pkPrefix": "USR#" },
  });
  const user = items?.[0];

  if (!user) {
    const error = new Error("Usuario no existe.");
    error.statusCode = 401;
    throw error;
  }

  if (!user.password) {
    const error = new Error("Actualizar usuario.");
    error.statusCode = 406;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Usuario desactivado.");
    error.statusCode = 403;
    throw error;
  }

  const validate = await bcrypt.compare(data.password, user.password);
  if (!validate) {
    const error = new Error("Credenciales inválidas.");
    error.statusCode = 401;
    throw error;
  }

  // Resolver accesos IAM y perfiles desde la nueva estructura
  const { access, profileIds, profileTitles } = await resolveUserSession(user.email);

  if (!access || access.length === 0) {
    const error = new Error("Acceso Restringido.");
    error.statusCode = 403;
    throw error;
  }

  const now = new Date().toISOString();
  const userId = user.pk.replace('USR#', '');

  const [globalConfig] = await Promise.all([
    getGlobalConfig(DYNAMODB_CONFIG_TABLE),
    dynamoDbLib.update({
      TableName: DYNAMODB_USER_TABLE,
      Key: { pk: user.pk, sk: user.sk },
      UpdateExpression: "SET lastAccess = :lastAccess",
      ExpressionAttributeValues: { ":lastAccess": now },
    }),
    // Actualizar directorio de usuarios para listado sin scan
    dynamoDbLib.put({
      TableName: DYNAMODB_USER_TABLE,
      Item: {
        pk: APP_USERS_PK,
        sk: `USR#${user.email}`,
        id: userId,
        email: user.email,
        fullName: user.fullName,
        gsiOne: user.gsiOne,
        isActive: user.isActive,
        phoneNumber: user.phoneNumber ?? null,
        createdAt: user.createdAt ?? now,
        updatedAt: now,
      },
    }),
  ]);

  const token = generateToken(
    {
      allowances: "crud",
      email: user.email,
      profiles: profileTitles,
      profileIds,
    },
    SECRET
  );

  return success(200, {
    sk: user.sk,
    email: user.email,
    fullName: user.fullName,
    gsiOne: user.gsiOne,
    phoneNumber: user.phoneNumber ?? null,
    avatarUrl: user.avatarUrl ?? null,
    token,
    access,
    profiles: profileTitles,
    globalConfig,
  }, action);
};

export const main = standardMiddleware(handler);
