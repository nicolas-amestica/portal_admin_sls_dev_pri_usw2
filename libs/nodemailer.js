import nodemailer from 'nodemailer';
import { getAWSConfigs } from './configs';

let transporter;

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
