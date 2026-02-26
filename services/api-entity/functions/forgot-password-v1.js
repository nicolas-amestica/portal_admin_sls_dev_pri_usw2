import crypto from "crypto";
import nodemailer from "nodemailer";
import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { cleanRut as parseRut } from "../../../utils/rut.js";
import { resolvePromises } from "../../../helpers/allsettled";
import { getSecretManagerValue } from "../../../libs/secret-manager";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const {
  STAGE,
  URL_DEV,
  URL_PRD,
  URL_LOCAL,
  IS_OFFLINE,
  EMAIL_SECRET_KEY,
  TOKEN_EXPIRATION,
  DYNAMODB_USER_TABLE
 } = process.env;

const STAGE_URL_MAP = {
  local: URL_LOCAL,
  dev: URL_DEV,
  prd: URL_PRD,
};

const FRONTEND_URL = STAGE_URL_MAP[IS_OFFLINE === "true" ? "local" : STAGE] ?? URL_PRD;

let emailConfig = null;

/**
 * Obtiene la configuración de correo electrónico desde el Secret Manager. La configuración se almacena en caché para evitar múltiples llamadas al Secret Manager.
 */
const getEmailConfig = async () => {
  if (!emailConfig) {
    emailConfig = JSON.parse(await getSecretManagerValue(EMAIL_SECRET_KEY));
  }
  return emailConfig;
};

/**
 * Genera un token seguro de recuperación de contraseña de 32 caracteres hexadecimales.
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Crea y configura un transportador de nodemailer usando credenciales del Secret Manager.
 */
const createEmailTransporter = (emailConfig) => {
  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
  });
};

/**
 * Genera el contenido HTML del correo electrónico de recuperación de contraseña.
 *
 * @param {string} userName - Nombre del usuario.
 * @param {string} resetUrl - URL para restablecer la contraseña.
 * @returns {string} Contenido HTML del correo electrónico.
 */
const generateEmailTemplate = (userName, resetUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperación de Contraseña</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Giras Indómito</h1>
        <p style="color: white; margin: 10px 0 0 0;">Portal Administrativo</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Recuperación de Contraseña</h2>
        
        <p>Hola <strong>${userName}</strong>,</p>
        
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Portal Administrativo de Giras Indómito.</p>
        
        <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    display: inline-block;
                    font-weight: bold;">
            Restablecer Contraseña
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:
        </p>
        <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
          ${resetUrl}
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px; margin: 5px 0;">
            <strong>Importante:</strong>
          </p>
          <ul style="color: #999; font-size: 12px;">
            <li>Este enlace expirará en 1 hora por razones de seguridad.</li>
            <li>Si no solicitaste este cambio, ignora este correo y tu contraseña permanecerá sin cambios.</li>
            <li>Por seguridad, nunca compartas este enlace con nadie.</li>
          </ul>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Giras Indómito - Portal Administrativo</p>
          <p>Este es un correo automático, por favor no responder.</p>
        </div>
      </div>
    </body>
    </html>
  `;
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

    const emailConfig = await getEmailConfig();
    const transporter = createEmailTransporter(emailConfig);
    
    const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Portal Administrativo - Giras Indómito" <${emailConfig.user}>`,
      to: user.email,
      subject: "Recuperación de Contraseña - Giras Indómito",
      html: generateEmailTemplate(user.name || user.gsiOne, resetUrl),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo de recuperación enviado exitosamente a ${user.email} para el usuario ${cleanRut}`);

    return success(200, securityMessage, action);
  } catch (e) {
    console.error("Error en recuperación de contraseña:", e);
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return success(200, { message: "Si el RUT está registrado, recibirás un correo con instrucciones para recuperar tu contraseña.", }, action);
  }
};

export const main = standardMiddleware(handler);
