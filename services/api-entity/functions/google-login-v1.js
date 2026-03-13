import axios from "axios";
import jwt from "jsonwebtoken";
import { getAccessProfile } from "./access-profile.js";
import { success } from "../../../helpers/responses.js";
import * as dynamoDbLib from "../../../libs/dynamodb-v3.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { getSecretManagerValue } from "../../../libs/secret-manager.js";
import { getGlobalConfig } from "../../../helpers/get-global-config.js";

const { DYNAMODB_USER_TABLE, DYNAMODB_CONFIG_TABLE, SECRET_KEY, GOOGLE_CLIENT_ID } = process.env;

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
    ExpressionAttributeNames: { "#email": "email" },
    ExpressionAttributeValues: { ":email": email },
  };

  const items = await dynamoDbLib.query(params);
  return items ? items[0] : null;
};

/**
 * Obtiene la lista consolidada de accesos del usuario, combinando
 * accesos directos del usuario y accesos de sus perfiles asignados.
 *
 * @param {Object} user - Objeto usuario de DynamoDB.
 * @returns {Promise<Array>} Lista de accesos combinados del usuario.
 */
const resolveUserAccess = async (user) => {
  const profileAccess = [];
  for (const profile of user.profiles ?? []) {
    const access = await getAccessProfile(profile);
    if (access) profileAccess.push(...(access[0]?.access ?? []));
  }
  return [...(user.access ?? []), ...profileAccess];
};

/**
 * Manejador principal del inicio de sesión con Google OAuth.
 *
 * Flujo:
 * 1. Valida el credential (ID token) emitido por Google Identity Services.
 * 2. Busca al usuario registrado por su email en DynamoDB.
 * 3. Verifica que el usuario esté activo y tenga accesos configurados.
 * 4. Actualiza la fecha de último acceso.
 * 5. Genera un JWT de la aplicación con los mismos permisos que el login tradicional.
 * 6. Retorna la respuesta en el mismo formato que el login con credenciales.
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

  const access = await resolveUserAccess(user);

  if (access.length === 0) {
    const error = new Error("Acceso Restringido.");
    error.statusCode = 403;
    throw error;
  }

  await dynamoDbLib.update({
    TableName: DYNAMODB_USER_TABLE,
    Key: { pk: user.pk, sk: user.sk },
    UpdateExpression: "SET lastAccess = :lastAccess, avatarUrl = :avatarUrl",
    ExpressionAttributeValues: { ":lastAccess": new Date().toISOString(), ":avatarUrl": googleUser.picture ?? null },
  });

  const secret = await getSecretManagerValue(SECRET_KEY);
  const token = generateToken(
    { allowances: "crud", userRun: user.gsiOne, profiles: user.profiles },
    secret
  );

  const responseUser = { ...user };
  delete responseUser.password;
  delete responseUser.content;
  responseUser.token = token;
  responseUser.access = access;
  responseUser.globalConfig = await getGlobalConfig(DYNAMODB_CONFIG_TABLE);
  responseUser.userConfig = user.userConfig ?? { language: "es" };
  responseUser.avatarUrl = googleUser.picture ?? null;

  return success(200, responseUser, action);
};

export const main = standardMiddleware(handler);
