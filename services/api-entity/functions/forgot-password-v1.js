import crypto from "crypto";
import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { cleanRut as parseRut } from "../../../utils/rut.js";
import { resolvePromises } from "../../../helpers/allsettled";
import { FORGOT_PASSWORD } from "../helpers/forgot-password-email.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { sendEmail, generateEmailHTML } from "../../../libs/nodemailer.js";

const {
  STAGE,
  URL_DEV,
  URL_PRD,
  URL_LOCAL,
  IS_OFFLINE,
  TOKEN_EXPIRATION,
  DYNAMODB_USER_TABLE
 } = process.env;

const STAGE_URL_MAP = {
  local: URL_LOCAL,
  dev: URL_DEV,
  prd: URL_PRD,
};

const FRONTEND_URL = STAGE_URL_MAP[IS_OFFLINE === "true" ? "local" : STAGE] ?? URL_PRD;
const MESSAGE = STAGE === 'prd' ? FORGOT_PASSWORD.prd : FORGOT_PASSWORD.dev;

/**
 * Genera un token seguro de recuperación de contraseña de 32 caracteres hexadecimales.
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Función principal para la recuperación de contraseña de usuario.
 */
const handler = async (event) => {
  console.log("Event ==>", event);
  const action = "Recuperación de contraseña.";
  const data = event.body;

  if (!data.rut) {
    const error = new Error('El RUT es requerido.');
    error.statusCode = 400;
    throw error;
  }

  const cleanRut = parseRut(data.rut);

  const params = {
    TableName: DYNAMODB_USER_TABLE,
    IndexName: "gsiOne-index",
    ReturnConsumedCapacity: "TOTAL",
    KeyConditionExpression: "#gsiOne = :gsiOne",
    ExpressionAttributeValues: {
      ":gsiOne": cleanRut,
    },
    ExpressionAttributeNames: {
      "#gsiOne": "gsiOne",
    },
  };

  try {
    const userPromise = dynamoDbLib.query(params);
    const [resultPromises] = await resolvePromises([userPromise]);

    const securityMessage = {
      message:
        "Si el RUT está registrado, recibirás un correo con instrucciones para recuperar tu contraseña.",
    };

    if (!resultPromises[0]) {
      console.log(`Usuario con RUT ${cleanRut} no encontrado.`);
      return success(200, securityMessage, action);
    }

    const user = resultPromises[0];

    if (!user.isActive) {
      console.log(`Usuario con RUT ${cleanRut} está desactivado.`);
      return success(200, securityMessage, action);
    }

    if (!user.email) {
      console.log(`Usuario con RUT ${cleanRut} no tiene email registrado.`);
      return success(200, securityMessage, action);
    }

    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + Number(TOKEN_EXPIRATION)).toISOString();

    const updateParams = {
      TableName: DYNAMODB_USER_TABLE,
      ReturnConsumedCapacity: "TOTAL",
      Key: {
        pk: user.pk,
        sk: user.sk,
      },
      UpdateExpression:
        "SET resetToken = :token, resetTokenExpiry = :expiry, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":token": resetToken,
        ":expiry": resetTokenExpiry,
        ":updatedAt": new Date().toISOString(),
      },
    };

    await dynamoDbLib.update(updateParams);

    const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: MESSAGE.subject,
      html: generateEmailHTML({
        recipientName: user.name || user.gsiOne,
        bodyHtml: MESSAGE.buildBody(resetUrl)
      })
    });

    console.log(`Correo de recuperación enviado exitosamente a ${user.email} para el usuario ${cleanRut}`);

    return success(200, securityMessage, action);
  } catch (e) {
    console.error("Error en recuperación de contraseña:", e);
    return success(200, { message: "Si el RUT está registrado, recibirás un correo con instrucciones para recuperar tu contraseña.", }, action);
  }
};

export const main = standardMiddleware(handler);
