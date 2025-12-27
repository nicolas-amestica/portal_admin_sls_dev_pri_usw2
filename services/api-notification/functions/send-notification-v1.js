import middy from "@middy/core";
import { CONTRACT } from '../constants/messages';
import { success, unsuccessful } from "../../../helpers/responses";
import multipartBodyParser from "@middy/http-multipart-body-parser";
import { sendEmailWithAttachments } from '../../../libs/nodemailer';

const { STAGE } = process.env;
const ACTION = "Enviar notificación de contrato";
const MESSAGE = STAGE === 'dev' ? CONTRACT.dev : CONTRACT.prd;

/**
 * Manejador base para el envío de notificaciones por correo electrónico con archivo adjunto.
 *
 * @async
 * @function baseHandler
 * @param {Object} event - Objeto de evento que contiene la información de la solicitud
 * @param {Object} event.body - Cuerpo de la solicitud con los datos del correo
 * @param {string} event.body.name - Nombre del destinatario
 * @param {string} event.body.email - Dirección de correo electrónico del destinatario
 * @param {Object} event.body.file - Objeto que contiene la información del archivo adjunto
 * @param {Buffer|string|Object} event.body.file.content - Contenido del archivo en formato Buffer, base64 o objeto Buffer
 * @param {string} [event.body.file.filename='contrato.pdf'] - Nombre del archivo adjunto
 * @param {string} [event.body.file.contentType='application/pdf'] - Tipo MIME del archivo
 * @param {string} [event.body.file.mimetype] - Tipo MIME alternativo del archivo
 * @param {string} event.body.preview - Indicador de tipo de mensaje ('1' para preview, otro valor para confirmado)
 * @returns {Promise<Object>} Objeto de respuesta con el resultado del envío
 * @returns {number} return.statusCode - Código de estado HTTP
 * @returns {Object} return.data - Datos de la respuesta
 * @returns {string} return.data.message - Mensaje descriptivo del resultado
 * @returns {string} [return.data.messageId] - ID del mensaje enviado (en caso de éxito)
 * @returns {string} [return.data.recipient] - Email del destinatario (en caso de éxito)
 * @throws {Error} Retorna respuesta unsuccessful en caso de error, con código de estado y detalles del error
 * @description
 * Esta función valida los campos requeridos, procesa el archivo adjunto convirtiéndolo a Buffer si es necesario,
 * genera un correo HTML formateado según el tipo de mensaje (preview o confirmado) y lo envía al destinatario
 * especificado utilizando la función sendEmailWithAttachments.
 */
const baseHandler = async (event) => {
  try {
    const { name, email, file, preview } = event.body;

    const requiredFields = ["name", "email", "preview", "file"];
    const missing = requiredFields.filter((f) => !event.body[f]);

    if (missing.length) return unsuccessful(400, { message: `Faltan campos requeridos: ${missing.join(", ")}` }, ACTION);

    if (!file || !file.content) return unsuccessful(400, { message: "No se encontró archivo adjunto" }, ACTION);

    const typeMessage = preview === '1' ? MESSAGE['preview'] : MESSAGE['confirmed'];

    const htmlContent = `
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
              <h2 style="margin: 0; color: #333;">${typeMessage.title}</h2>
            </div>
            <div class="content">
              <p>Estimado/a ${name},</p>
              <p>${typeMessage.body}</p>
              <p style="margin-top: 20px;">Por favor, revise el documento adjunto y no dude en contactarnos si tiene alguna pregunta.</p>
              <p>Saludos cordiales,<br><strong>Equipo Giras Indómito</strong></p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no responder a esta dirección.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    let fileContent = file.content;
    if (!Buffer.isBuffer(fileContent)) {
      if (typeof fileContent === 'string') {
        fileContent = Buffer.from(fileContent, 'base64');
      } else if (fileContent.type === 'Buffer' && Array.isArray(fileContent.data)) {
        fileContent = Buffer.from(fileContent.data);
      }
    }

    const attachments = [{
      filename: file.filename || 'contrato.pdf',
      content: fileContent,
      contentType: file.contentType || file.mimetype || 'application/pdf'
    }];

    const emailResult = await sendEmailWithAttachments({
      to: email,
      subject: `${typeMessage.subject}`,
      html: htmlContent,
      attachments: attachments
    });

    return success(200, {
      message: "Correo enviado exitosamente",
      messageId: emailResult.messageId,
      recipient: email
    }, ACTION);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, ACTION);
  }
};

/**
 * Función principal del handler para enviar notificaciones.
 *
 * Utiliza el middleware middy con un parser de cuerpo multipart para manejar
 * la carga de archivos en las solicitudes HTTP. Está configurado con un límite
 * de tamaño de archivo de 10MB.
 *
 * @type {middy.MiddyfiedHandler}
 * @constant
 *
 * @property {Object} multipartBodyParser - Middleware para parsear cuerpos multipart
 * @property {Object} multipartBodyParser.busboy - Configuración de busboy
 * @property {Object} multipartBodyParser.busboy.limits - Límites de carga
 * @property {number} multipartBodyParser.busboy.limits.fileSize - Tamaño máximo de archivo (10MB)
 */
export const main = middy(baseHandler).use(
  multipartBodyParser({
    busboy: {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    },
  })
);