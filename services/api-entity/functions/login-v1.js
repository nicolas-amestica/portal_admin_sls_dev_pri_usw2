import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getAccessProfile } from "./access-profile";
import { success, } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { resolvePromises } from "../../../helpers/allsettled";
import { getSecretManagerValue } from "../../../libs/secret-manager";
import { getGlobalConfig } from "../../../helpers/get-global-config";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_USER_TABLE, DYNAMODB_CONFIG_TABLE, SECRET_KEY } = process.env;

/**
 * Genera un token JWT firmado con los datos proporcionados y una clave secreta.
 */
const generateToken = (body, SECRET) => {
  const TIMEOUT = "3d";
  const token = jwt.sign({ body }, SECRET, { expiresIn: `${TIMEOUT}` });
  return token;
};

/**
 * Función principal para el inicio de sesión de usuario.
 */
const handler = async (event) => {
  console.log("Event ==>", event);
  const SECRET = await getSecretManagerValue(SECRET_KEY);
  const action = "Identificación de usuario.";
  const data = event.body;

  const gsi = data.username;
  const params = {
    TableName: DYNAMODB_USER_TABLE,
    IndexName: "gsiOne-index",
    ReturnConsumedCapacity: "TOTAL",
    KeyConditionExpression: "#gsiOne = :gsiOne",
    ExpressionAttributeValues: {
      ":gsiOne": gsi,
    },
    ExpressionAttributeNames: {
      "#gsiOne": "gsiOne",
    },
  };

  const userPromise = dynamoDbLib.query(params);
  const [resultPromises] = await resolvePromises([userPromise]);

  if (!resultPromises[0]?.profiles) {
    const error = new Error('Acceso Restringido.');
    error.statusCode = 403;
    throw error;
  }

  const accessProfiles = [];

  for (const profile of resultPromises[0].profiles) {
    const access = await getAccessProfile(profile);
    if (!access) {
      const error = new Error('Al usuario le faltan accesos habilitados.');
      error.statusCode = 403;
      throw error;
    }
    accessProfiles.push(...access[0]?.access);
  }

  const singleAccess = resultPromises[0].access || [];
  let access = [];

  if (singleAccess.length > 0) access = [...singleAccess];

  if (accessProfiles.length > 0)
    accessProfiles.forEach((acc) => access.push(acc));

  if (!access && access.length === 0) {
    const error = new Error('Acceso Restringido.');
    error.statusCode = 403;
    throw error;
  }

  const paramsLastAccess = {
    TableName: DYNAMODB_USER_TABLE,
    ReturnConsumedCapacity: "TOTAL",
    Key: {
      pk: resultPromises[0].pk,
      sk: resultPromises[0].sk,
    },
    UpdateExpression: "SET lastAccess = :label",
    ExpressionAttributeValues: {
      ":label": new Date().toISOString(),
    },
  };
  await dynamoDbLib.update(paramsLastAccess);

  const user = resultPromises[0];
  if (!user) {
    const error = new Error('Usuario no existe.');
    error.statusCode = 401;
    throw error;
  }

  if (!user.password) {
    const error = new Error('Actualizar usuario.');
    error.statusCode = 406;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Usuario desactivado.');
    error.statusCode = 403;
    throw error;
  }

  const validate = await bcrypt.compare(data.password, user.password);
  if (!validate) {
    const error = new Error('Credenciales inválidas.');
    error.statusCode = 401;
    throw error;
  }

  delete user.password;
  delete user.content;
  const paramsToken = { allowances: "crud", userRun: user.gsiOne, profiles: user.profiles };

  const token = generateToken(paramsToken, SECRET);
  user.token = token;
  user.access = access;

  // Obtener configuración global
  const globalConfig = await getGlobalConfig(DYNAMODB_CONFIG_TABLE);

  // Obtener o inicializar configuración de usuario
  let userConfig = user.userConfig || { language: "es" };

  // Si el usuario no tiene configuración, inicializarla
  if (!user.userConfig) {
    const paramsUpdateConfig = {
      TableName: DYNAMODB_USER_TABLE,
      ReturnConsumedCapacity: "TOTAL",
      Key: {
        pk: user.pk,
        sk: user.sk,
      },
      UpdateExpression: "SET userConfig = :userConfig",
      ExpressionAttributeValues: {
        ":userConfig": userConfig,
      },
    };
    await dynamoDbLib.update(paramsUpdateConfig);
  }

  // Agregar configuraciones a la respuesta
  user.globalConfig = globalConfig;
  user.userConfig = userConfig;

  return success(200, user, action);
};

export const main = standardMiddleware(handler);
