import jwt from 'jsonwebtoken';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { getParameterValue } from '../../../libs/parameter-store.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';

const ACTION = 'Registrar token FCM';
const FCM_PK = 'FCM_TOKENS';
const FCM_SK = 'ALL';
const { SECRET_KEY, DYNAMODB_CONFIG_TABLE } = process.env;

/**
 * Decodifica el JWT del header Authorization y retorna el email del usuario.
 *
 * @param {string} authHeader - Header Authorization completo.
 * @param {string} secret - Clave secreta para verificar el JWT.
 * @returns {Promise<string>} Email del usuario autenticado.
 */
async function extractEmailFromToken(authHeader, secret) {
  if (!authHeader?.startsWith('Bearer ')) {
    const err = new Error('Token de acceso requerido.');
    err.statusCode = 401;
    throw err;
  }
  const decoded = jwt.verify(authHeader.split(' ')[1], secret);
  const email = decoded.body?.email;
  if (!email) {
    const err = new Error('Token sin información de usuario.');
    err.statusCode = 401;
    throw err;
  }
  return email;
}

/**
 * Guarda el token FCM del usuario en la tabla de configuración.
 * Utiliza el email como clave del mapa para identificar el dispositivo por usuario.
 *
 * @param {string} email - Email del usuario autenticado.
 * @param {string} fcmToken - Token FCM del dispositivo/navegador.
 */
async function saveFcmToken(email, fcmToken) {
  // Paso 1: inicializar el mapa tokens si no existe aún
  await dynamoDbLib.update({
    TableName: DYNAMODB_CONFIG_TABLE,
    Key: { pk: FCM_PK, sk: FCM_SK },
    UpdateExpression: 'SET #tokens = if_not_exists(#tokens, :empty)',
    ExpressionAttributeNames: { '#tokens': 'tokens' },
    ExpressionAttributeValues: { ':empty': {} },
  });

  // Paso 2: registrar/actualizar el token de este usuario
  await dynamoDbLib.update({
    TableName: DYNAMODB_CONFIG_TABLE,
    Key: { pk: FCM_PK, sk: FCM_SK },
    UpdateExpression: 'SET #tokens.#email = :token',
    ExpressionAttributeNames: { '#tokens': 'tokens', '#email': email },
    ExpressionAttributeValues: { ':token': fcmToken },
  });
}

/**
 * Handler Lambda: registra o actualiza el token FCM del usuario autenticado.
 * El token se almacena en la config table bajo la clave FCM_TOKENS / ALL.
 */
const baseHandler = async (event) => {
  const { token: fcmToken } = event.body ?? {};
  if (!fcmToken || typeof fcmToken !== 'string') {
    return unsuccessful(400, { message: 'El campo token es requerido.' }, ACTION);
  }

  const authHeader = event.headers?.authorization ?? event.headers?.Authorization;
  const secret = await getParameterValue(SECRET_KEY);
  const email = await extractEmailFromToken(authHeader, secret);

  await saveFcmToken(email, fcmToken);
  return success(200, { registered: true }, ACTION);
};

export const main = standardMiddleware(baseHandler);
