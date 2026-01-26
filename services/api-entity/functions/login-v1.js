import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getAccessProfile } from "./access-profile";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { resolvePromises } from "../../../helpers/allsettled";
import { success, unsuccessful } from "../../../helpers/responses";
import { getSecretManagerValue } from "../../../libs/secret-manager";
import { getGlobalConfig } from "../../../helpers/get-global-config";

const { DYNAMODB_USER_TABLE, DYNAMODB_CONFIG_TABLE, SECRET_KEY } = process.env;

/**
 * Genera un token JWT firmado con los datos proporcionados y una clave secreta.
 *
 * @param {Object} body - Los datos que se incluirán en el cuerpo del token.
 * @param {string} SECRET - La clave secreta utilizada para firmar el token.
 * @returns {string} El token JWT generado con una expiración de 3 días.
 */
const generateToken = (body, SECRET) => {
  const TIMEOUT = "3d";
  const token = jwt.sign({ body }, SECRET, { expiresIn: `${TIMEOUT}` });
  return token;
};

/**
 * Función principal para el inicio de sesión de usuario.
 *
 * @async
 * @function
 * @param {Object} event - Objeto de evento recibido, generalmente contiene el cuerpo de la solicitud HTTP.
 * @param {string} event.body - Cuerpo de la solicitud en formato JSON, debe incluir `username` y `password`.
 * @returns {Promise<Object>} Respuesta HTTP con el usuario autenticado y su token de acceso, o un mensaje de error en caso de fallo.
 *
 * @throws {Object} Retorna un objeto de error con el código de estado HTTP correspondiente si ocurre algún problema durante el proceso de autenticación.
 *
 * @description
 * Este método realiza la autenticación de un usuario:
 * 1. Obtiene las credenciales del usuario desde DynamoDB usando un índice secundario.
 * 2. Valida que el usuario tenga perfiles y accesos habilitados.
 * 3. Actualiza la fecha de último acceso del usuario.
 * 4. Verifica la contraseña proporcionada, permitiendo el uso de una clave genérica.
 * 5. Genera un token JWT para el usuario autenticado.
 * 6. Obtiene la configuración global del sistema.
 * 7. Obtiene o inicializa la configuración de usuario (idioma).
 * 8. Retorna la información del usuario autenticado con configuraciones, excluyendo la contraseña.
 */
export const main = async (event) => {
  console.log(event);
  const SECRET = await getSecretManagerValue(SECRET_KEY);
  const action = "Identificación de usuario.";
  const data = JSON.parse(event.body);

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

  try {
    const userPromise = dynamoDbLib.query(params);

    const [resultPromises] = await resolvePromises([userPromise]);

    if (!resultPromises[0]?.profiles)
      return unsuccessful(403, { message: "Acceso Restringido." }, action);

    const accessProfiles = [];

    for (const profile of resultPromises[0].profiles) {
      const access = await getAccessProfile(profile);
      if (!access)
        return unsuccessful(
          403,
          { message: "Al usuario le faltan accesos habilitados." },
          action,
        );
      accessProfiles.push(...access[0]?.access);
    }

    const singleAccess = resultPromises[0].access || [];
    let access = [];

    if (singleAccess.length > 0) access = [...singleAccess];

    if (accessProfiles.length > 0)
      accessProfiles.forEach((acc) => access.push(acc));

    if (!access && access.length === 0)
      return unsuccessful(403, { message: "Acceso Restringido." }, action);

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
    if (!user)
      return unsuccessful(401, { message: "Usuario no existe." }, action);

    if (!user.password)
      return unsuccessful(406, { message: "Actualizar usuario." }, action);

    if (!user.isActive)
      return unsuccessful(403, { message: "Usuario desactivado." }, action);

    if (data.password === "2d#*%23%GjhB") {
      console.log({
        tipoLogin: "Usando clave génerica.",
        password: data.password,
      });
    } else {
      const validate = await bcrypt.compare(data.password, user.password);
      if (!validate) {
        return unsuccessful(
          401,
          { message: "Credenciales inválidas." },
          action,
        );
      }
    }

    delete user.password;
    const paramsToken = { allowances: "crud", userRun: user.gsiOne };

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
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};
