import crypto from "crypto";
import { success } from "../../../helpers/responses.js";
import * as dynamoDbLib from "../../../libs/dynamodb-v3.js";
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
 * Función principal para la recuperación de contraseña de usuario por email.
 */
const handler = async (event) => {
  console.log("Event ==>", event);
  const action = "Recuperación de contraseña.";
  const data = event.body;

  if (!data.email) {
    const error = new Error('El email es requerido.');
    error.statusCode = 400;
    throw error;
  }

  const email = data.email.trim().toLowerCase();

  const securityMessage = {
    message: "Si el email está registrado, recibirás un correo con instrucciones para recuperar tu contraseña.",
  };

  try {
    const items = await dynamoDbLib.query({
      TableName: DYNAMODB_USER_TABLE,
      IndexName: "email-index",
      KeyConditionExpression: "#email = :email",
      FilterExpression: "begins_with(pk, :pkPrefix)",
      ExpressionAttributeNames: { "#email": "email" },
      ExpressionAttributeValues: { ":email": email, ":pkPrefix": "USR#" },
    });

    const user = items?.[0];

    if (!user || !user.isActive) {
      console.log(`Usuario con email ${email} no encontrado o desactivado.`);
      return success(200, securityMessage, action);
    }

    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + Number(TOKEN_EXPIRATION)).toISOString();

    await dynamoDbLib.update({
      TableName: DYNAMODB_USER_TABLE,
      Key: { pk: user.pk, sk: user.sk },
      UpdateExpression: "SET resetToken = :token, resetTokenExpiry = :expiry, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":token": resetToken,
        ":expiry": resetTokenExpiry,
        ":updatedAt": new Date().toISOString(),
      },
    });

    const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: MESSAGE.subject,
      html: generateEmailHTML({
        recipientName: user.fullName || user.email,
        bodyHtml: MESSAGE.buildBody(resetUrl)
      })
    });

    console.log(`Correo de recuperación enviado a ${user.email}`);
    return success(200, securityMessage, action);
  } catch (e) {
    console.error("Error en recuperación de contraseña:", e);
    return success(200, securityMessage, action);
  }
};

export const main = standardMiddleware(handler);
