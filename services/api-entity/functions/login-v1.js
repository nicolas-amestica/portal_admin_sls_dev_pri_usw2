import bcrypt from "bcryptjs";
import { resolveUserSession } from "./access-profile.js";
import { success } from "../../../helpers/responses.js";
import * as dynamoDbLib from "../../../libs/dynamodb-v3.js";
import { getParameterValue } from "../../../libs/parameter-store.js";
import { getGlobalConfig } from "../../../helpers/get-global-config.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { assertPortalJwtSecret, signPortalJwt } from "../../../libs/jwt-portal.js";
import { buildJwtEndpointsFromAccess } from "../../../libs/fn-build-jwt-endpoints-from-access.js";

const { DYNAMODB_USER_TABLE, DYNAMODB_CONFIG_TABLE, SECRET_KEY } = process.env;
const APP_USERS_PK = "APP#USERS";

/** Máximo de intentos fallidos antes de exigir restablecimiento de contraseña. */
const MAX_FAILED_ATTEMPTS = 3;

/** Motivo persistido en el ítem de usuario al bloquear por intentos. */
const LOCK_REASON_TOO_MANY_ATTEMPTS =
  "Bloqueo por seguridad: demasiados intentos fallidos de inicio de sesión.";

/**
 * @description Error genérico sin filtrar existencia de usuario (401).
 */
const genericAuthError = () => {
  const error = new Error("Credenciales inválidas o cuenta no disponible.");
  error.statusCode = 401;
  return error;
};

/**
 * @description Error de autenticación con metadatos para el cliente (intentos restantes / bloqueo).
 * @param {string} message - Mensaje para el usuario.
 * @param {object} portalData - Campos extra en `data` del body de error.
 */
const authErrorWithPortal = (message, portalData) => {
  const error = new Error(message);
  error.statusCode = 401;
  error.portalData = portalData;
  return error;
};

/**
 * @description Registra intento fallido de contraseña e incrementa contador; bloquea en el umbral.
 */
const recordFailedPasswordAttempt = async (user) => {
  const current = Number(user.failedLoginAttempts) || 0;
  const newAttempts = current + 1;
  const locked = newAttempts >= MAX_FAILED_ATTEMPTS;
  const now = new Date().toISOString();

  if (locked) {
    await dynamoDbLib.update({
      TableName: DYNAMODB_USER_TABLE,
      Key: { pk: user.pk, sk: user.sk },
      UpdateExpression:
        "SET failedLoginAttempts = :a, passwordResetRequired = :pr, lockReason = :lr, updatedAt = :ts",
      ExpressionAttributeValues: {
        ":a": newAttempts,
        ":pr": true,
        ":lr": LOCK_REASON_TOO_MANY_ATTEMPTS,
        ":ts": now,
      },
    });
    throw authErrorWithPortal(
      "Cuenta deshabilitada por seguridad tras 3 intentos fallidos. Debes restablecer tu contraseña.",
      {
        maxAttempts: MAX_FAILED_ATTEMPTS,
        remainingAttempts: 0,
        accountLocked: true,
      },
    );
  }

  await dynamoDbLib.update({
    TableName: DYNAMODB_USER_TABLE,
    Key: { pk: user.pk, sk: user.sk },
    UpdateExpression: "SET failedLoginAttempts = :a, updatedAt = :ts",
    ExpressionAttributeValues: {
      ":a": newAttempts,
      ":ts": now,
    },
  });

  const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
  throw authErrorWithPortal(
    `Credenciales incorrectas. Te quedan ${remaining} ${remaining === 1 ? "intento" : "intentos"}.`,
    {
      maxAttempts: MAX_FAILED_ATTEMPTS,
      remainingAttempts: remaining,
      accountLocked: false,
    },
  );
};

/**
 * Inicia sesión de usuario validando credenciales y resolviendo accesos IAM.
 * Flujo: buscar usuario → validar contraseña → resolver accesos IAM → generar JWT.
 */
const handler = async (event) => {
  const SECRET = await getParameterValue(SECRET_KEY);
  assertPortalJwtSecret(SECRET);
  const action = "Identificación de usuario.";
  const data = event.body;

  const items = await dynamoDbLib.query({
    TableName: DYNAMODB_USER_TABLE,
    IndexName: "email-index",
    KeyConditionExpression: "#email = :email",
    FilterExpression: "begins_with(pk, :pkPrefix)",
    ExpressionAttributeNames: { "#email": "email" },
    ExpressionAttributeValues: {
      ":email": data.email?.trim()?.toLowerCase(),
      ":pkPrefix": "USR#",
    },
  });
  const user = items?.[0];

  if (!user) {
    throw genericAuthError();
  }

  if (!user.password) {
    throw genericAuthError();
  }

  if (!user.isActive) {
    throw genericAuthError();
  }

  if (user.passwordResetRequired === true) {
    throw authErrorWithPortal(
      'Tu cuenta fue bloqueada por seguridad. Debes restablecer tu contraseña usando "¿Olvidaste tu contraseña?".',
      {
        maxAttempts: MAX_FAILED_ATTEMPTS,
        remainingAttempts: 0,
        accountLocked: true,
      },
    );
  }

  const validate = await bcrypt.compare(data.password, user.password);
  if (!validate) {
    await recordFailedPasswordAttempt(user);
  }

  // Resolver accesos IAM, perfiles y módulos favoritos del menú
  const { access, profileIds, profileTitles, moduleFavorites } = await resolveUserSession(user.email);

  if (!access || access.length === 0) {
    throw genericAuthError();
  }

  const now = new Date().toISOString();
  const userId = user.pk.replace("USR#", "");

  const [globalConfig] = await Promise.all([
    getGlobalConfig(DYNAMODB_CONFIG_TABLE),
    dynamoDbLib.update({
      TableName: DYNAMODB_USER_TABLE,
      Key: { pk: user.pk, sk: user.sk },
      UpdateExpression:
        "SET lastAccess = :lastAccess, failedLoginAttempts = :zero, passwordResetRequired = :prFalse, updatedAt = :ts REMOVE lockReason",
      ExpressionAttributeValues: {
        ":lastAccess": now,
        ":zero": 0,
        ":prFalse": false,
        ":ts": now,
      },
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

  const endpoints = buildJwtEndpointsFromAccess(access);
  const token = signPortalJwt(
    {
      body: {
        allowances: "crud",
        email: user.email,
        profiles: profileTitles,
        profileIds,
        endpoints,
      },
    },
    SECRET,
  );

  return success(
    200,
    {
      sk: user.sk,
      email: user.email,
      fullName: user.fullName,
      gsiOne: user.gsiOne,
      phoneNumber: user.phoneNumber ?? null,
      avatarUrl: user.avatarUrl ?? null,
      token,
      access,
      moduleFavorites: moduleFavorites ?? [],
      profiles: profileTitles,
      globalConfig,
    },
    action,
  );
};

export const main = standardMiddleware(handler);
