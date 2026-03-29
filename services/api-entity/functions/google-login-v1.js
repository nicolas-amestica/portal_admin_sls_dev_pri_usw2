import axios from "axios";
import jwt from "jsonwebtoken";
import { resolveUserSession } from "./access-profile.js";
import { success } from "../../../helpers/responses.js";
import * as dynamoDbLib from "../../../libs/dynamodb-v3.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { getParameterValue } from "../../../libs/parameter-store.js";
import { getGlobalConfig } from "../../../helpers/get-global-config.js";

const { DYNAMODB_USER_TABLE, DYNAMODB_CONFIG_TABLE, SECRET_KEY, GOOGLE_CLIENT_ID } = process.env;
const APP_USERS_PK = 'APP#USERS';

/**
 * Genera un token JWT firmado con los datos del usuario.
 *
 * @param {Object} body - Datos para incluir en el payload del token.
 * @param {string} secret - Clave secreta para firmar el token.
 * @returns {string} Token JWT con expiración de 3 días.
 */
const generateToken = (body, secret) => {
  return jwt.sign({ body }, secret, { expiresIn: "3d" });
};

/**
 * Valida el ID token de Google llamando al endpoint tokeninfo de Google.
 * Verifica que el audience corresponda al cliente configurado y que el email esté verificado.
 *
 * @param {string} credential - ID token emitido por Google Identity Services.
 * @returns {Promise<Object>} Datos del usuario de Google (email, name, sub, etc.).
 * @throws {Error} Si el token es inválido, el audience no coincide o el email no está verificado.
 */
const validateGoogleIdToken = async (credential) => {
  const { data } = await axios.get(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
  );

  if (data.aud !== GOOGLE_CLIENT_ID) {
    const error = new Error("Token de Google inválido: cliente no autorizado.");
    error.statusCode = 401;
    throw error;
  }

  if (!data.email_verified || data.email_verified === "false") {
    const error = new Error("El correo electrónico de Google no está verificado.");
    error.statusCode = 401;
    throw error;
  }

  return data;
};

/**
 * Busca un usuario en la tabla de usuarios por email usando el GSI email-index.
 *
 * @param {string} email - Correo electrónico del usuario a buscar.
 * @returns {Promise<Object|null>} Usuario encontrado o null si no existe.
 */
const findUserByEmail = async (email) => {
  const params = {
    TableName: DYNAMODB_USER_TABLE,
    IndexName: "email-index",
    KeyConditionExpression: "#email = :email",
    FilterExpression: "begins_with(pk, :pkPrefix)",
    ExpressionAttributeNames: { "#email": "email" },
    ExpressionAttributeValues: { ":email": email, ":pkPrefix": "USR#" },
  };

  const items = await dynamoDbLib.query(params);
  return items ? items[0] : null;
};

/**
 * Manejador principal del inicio de sesión con Google OAuth.
 *
 * Flujo:
 * 1. Valida el credential (ID token) emitido por Google Identity Services.
 * 2. Busca al usuario registrado por su email en DynamoDB.
 * 3. Verifica que el usuario esté activo.
 * 4. Resuelve los accesos IAM del usuario.
 * 5. Actualiza la fecha de último acceso y avatar.
 * 6. Genera un JWT de la aplicación.
 * 7. Retorna la respuesta en el mismo formato que el login con credenciales.
 *
 * @note Solo usuarios previamente registrados por el administrador pueden acceder.
 */
const handler = async (event) => {
  console.log("Event ==>", event);
  const action = "Identificación de usuario con Google.";
  const { credential } = event.body;

  if (!credential) {
    const error = new Error("Se requiere el token de credencial de Google.");
    error.statusCode = 400;
    throw error;
  }

  const googleUser = await validateGoogleIdToken(credential);
  const user = await findUserByEmail(googleUser.email);

  if (!user) {
    const error = new Error(
      "Usuario no registrado. Contacta al administrador para obtener acceso."
    );
    error.statusCode = 404;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Usuario desactivado.");
    error.statusCode = 403;
    throw error;
  }

  const { access, profileIds, profileTitles, moduleFavorites } = await resolveUserSession(user.email);

  if (access.length === 0) {
    const error = new Error("Acceso Restringido.");
    error.statusCode = 403;
    throw error;
  }

  const avatarUrl = googleUser.picture ?? null;
  const now = new Date().toISOString();
  const userId = user.pk.replace('USR#', '');

  const [secret, globalConfig] = await Promise.all([
    getParameterValue(SECRET_KEY),
    getGlobalConfig(DYNAMODB_CONFIG_TABLE),
    dynamoDbLib.update({
      TableName: DYNAMODB_USER_TABLE,
      Key: { pk: user.pk, sk: user.sk },
      UpdateExpression: "SET lastAccess = :lastAccess, avatarUrl = :avatarUrl",
      ExpressionAttributeValues: { ":lastAccess": now, ":avatarUrl": avatarUrl },
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
    secret
  );

  return success(200, {
    sk: user.sk,
    email: user.email,
    fullName: user.fullName,
    gsiOne: user.gsiOne,
    phoneNumber: user.phoneNumber ?? null,
    avatarUrl,
    token,
    access,
    moduleFavorites: moduleFavorites ?? [],
    profiles: profileTitles,
    globalConfig,
  }, action);
};

export const main = standardMiddleware(handler);
