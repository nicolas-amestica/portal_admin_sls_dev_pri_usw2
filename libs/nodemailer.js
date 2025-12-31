import nodemailer from 'nodemailer';
import { getAWSConfigs } from './configs';

let transporter;

/**
 * Genera el contenido HTML con formato estándar para los correos de Giras Indómito.
 *
 * @function
 * @param {Object} params - Parámetros para generar el HTML del correo.
 * @param {string} params.title - Título del correo que aparece en el header.
 * @param {string} params.recipientName - Nombre del destinatario.
 * @param {string} params.body - Cuerpo principal del mensaje.
 * @param {string} [params.footerText] - Texto del footer (por defecto: mensaje de correo automático).
 * @returns {string} Contenido HTML formateado del correo.
 */
export const generateEmailHTML = ({ title, recipientName, body, footerText }) => {
  const defaultFooterText = 'Este es un correo automático, por favor no responder a esta dirección.';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .content {
            padding: 20px;
            background-color: #ffffff;
          }
          .info-row {
            margin: 10px 0;
          }
          .label {
            font-weight: bold;
            color: #555;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; color: #333;">${title}</h2>
          </div>
          <div class="content">
            <p>Estimado/a ${recipientName},</p>
            <p>${body}</p>
            <p style="margin-top: 20px;">Por favor, revise el documento adjunto y no dude en contactarnos si tiene alguna pregunta.</p>
            <p>Saludos cordiales,<br><strong>Equipo Giras Indómito</strong></p>
          </div>
          <div class="footer">
            <p>${footerText || defaultFooterText}</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Inicializa el cliente de Nodemailer utilizando la configuración de correo.
 *
 * @async
 * @function
 * @returns {Promise<void>} Una promesa que se resuelve cuando el transporter ha sido inicializado.
 */
const initTransporter = async () => {
  await getAWSConfigs();

  transporter = nodemailer.createTransport({
    host: 'mail.girasindomito.cl',
    port: 465,
    secure: true, // true para puerto 465, false para otros puertos
    auth: {
      user: 'no-reply@girasindomito.cl',
      pass: 'GirasIndomito20221.'
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Envía un correo electrónico sin archivos adjuntos.
 *
 * @async
 * @function
 * @param {Object} options - Opciones para el envío del correo.
 * @param {string} options.to - Dirección de correo del destinatario.
 * @param {string} options.subject - Asunto del correo.
 * @param {string} [options.text] - Contenido del correo en texto plano (opcional).
 * @param {string} [options.html] - Contenido del correo en formato HTML (opcional).
 * @param {string} [options.from] - Dirección de correo del remitente (por defecto: no-reply@girasindomito.cl).
 * @returns {Promise<Object>} Información sobre el correo enviado.
 * @throws {Error} Si hay un error al enviar el correo.
 */
export const sendEmail = async (options) => {
  try {
    if (!transporter) await initTransporter();

    const mailOptions = {
      from: options.from || 'no-reply@girasindomito.cl',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};

/**
 * Envía un correo electrónico con archivos adjuntos.
 *
 * @async
 * @function
 * @param {Object} options - Opciones para el envío del correo.
 * @param {string} options.to - Dirección de correo del destinatario.
 * @param {string} options.subject - Asunto del correo.
 * @param {string} [options.text] - Contenido del correo en texto plano (opcional).
 * @param {string} [options.html] - Contenido del correo en formato HTML (opcional).
 * @param {Array<Object>} options.attachments - Arreglo de objetos con información de los archivos adjuntos.
 * @param {string} options.attachments[].filename - Nombre del archivo adjunto.
 * @param {Buffer|string} options.attachments[].content - Contenido del archivo (Buffer o string base64).
 * @param {string} [options.attachments[].contentType] - Tipo MIME del archivo (opcional).
 * @param {string} [options.attachments[].encoding] - Codificación del contenido si es string (ej: 'base64').
 * @param {string} [options.from] - Dirección de correo del remitente (por defecto: no-reply@girasindomito.cl).
 * @returns {Promise<Object>} Información sobre el correo enviado.
 * @throws {Error} Si hay un error al enviar el correo o si no se proporcionan adjuntos.
 */
export const sendEmailWithAttachments = async (options) => {
  try {
    if (!transporter) await initTransporter();

    if (!options.attachments || !Array.isArray(options.attachments) || options.attachments.length === 0) {
      throw new Error('Se requiere al menos un archivo adjunto.');
    }

    const mailOptions = {
      from: options.from || 'no-reply@girasindomito.cl',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};
