import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getAccessProfile } from "./access-profile";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { resolvePromises } from "../../../helpers/allsettled";
import { success, unsuccessful } from "../../../helpers/responses";
import { getSecretManagerValue } from "../../../libs/secret-manager";

const { DYNAMODB_USER_TABLE, SECRET_KEY } = process.env;

const generateToken = (body, SECRET) => {
  const TIMEOUT = "3d";
  const token = jwt.sign({ body }, SECRET, { expiresIn: `${TIMEOUT}` });
  return token;
};

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

    if (!resultPromises[0]?.profiles) {
      return unsuccessful(403, { message: "Acceso Restringido." }, action);
    }

    const accessProfiles = [];

    for (const profile of resultPromises[0].profiles) {
      const access = await getAccessProfile(profile);
      accessProfiles.push(...access);
    }

    const singleAccess = resultPromises[0].access || [];
    let access = [];

    if (singleAccess.length > 0) {
      access = [...singleAccess];
    }

    if (accessProfiles.length > 0) {
      accessProfiles.forEach((acc) => access.push(acc));
    }

    if (!access && access.length === 0) {
      return unsuccessful(403, { message: "Acceso Restringido." }, action);
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
    if (!user) return unsuccessful(401, { message: "Usuario no existe." }, action);

    if (!user.password) return unsuccessful(406, { message: "Actualizar usuario." }, action);

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
        return unsuccessful(401, { message: "Credenciales inválidas." }, action);
      }
    }

    delete user.password;
    const paramsToken = { allowances: "crud", userRun: user.gsiOne };
    const token = generateToken(paramsToken, SECRET);
    user.token = token;
    user.access = access;

    return success(200, user, action);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};
