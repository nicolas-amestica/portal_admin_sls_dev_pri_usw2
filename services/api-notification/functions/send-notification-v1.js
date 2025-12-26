import middy from "@middy/core";
import multipartBodyParser from "@middy/http-multipart-body-parser";
import { sendEmailWithAttachments } from '../../../libs/nodemailer';
import { success, unsuccessful } from "../../../helpers/responses";
import { CONTRACT } from '../constants/messages';

const { STAGE } = process.env;

const ACTION = "Enviar notificación";

const MESSAGE = STAGE === 'dev' ? CONTRACT.dev : CONTRACT.prd;

/**
 * Manejador principal para enviar un correo electrónico con adjunto (contrato).
 *
 * Proceso:
 * 1. Valida los campos requeridos en event.body (name, email, phone, file).
 * 2. Verifica que exista un archivo adjunto con contenido.
 * 3. Prepara el contenido del correo en formato HTML y texto plano.
 * 4. Envía el correo electrónico con el archivo adjunto usando nodemailer.
 * 5. Devuelve una respuesta normalizada mediante success() o unsuccessful().
 *
 * @async
 * @function baseHandler
 * @param {Object} event - Evento de AWS Lambda que contiene la información de la solicitud
 * @param {Object} event.body - Cuerpo de la solicitud parseado por multipartBodyParser
 * @param {string} event.body.name - Nombre de la persona
 * @param {string} event.body.email - Dirección de correo electrónico del destinatario
 * @param {string} event.body.phone - Número de teléfono de la persona
 * @param {boolean} event.body.preview - Indica si es un correo de vista previa (true) o confirmado (false)
 * @param {Object} event.body.file - Objeto con información del archivo adjunto (contrato)
 * @param {string} event.body.file.filename - Nombre del archivo
 * @param {Buffer} event.body.file.content - Contenido del archivo en formato Buffer
 * @param {string} [event.body.file.contentType] - Tipo MIME del archivo
 * @param {string} [event.body.file.mimetype] - Mime type alternativo (opcional)
 * @returns {Promise<Object>} Respuesta HTTP con información del envío o mensaje de error
 * @returns {number} returns.statusCode - Código de estado HTTP (200, 400, 500)
 * @returns {Object} returns.body - Cuerpo de la respuesta con resultado del envío o error
 * @throws {Error} Retorna error 400 si faltan campos requeridos
 * @throws {Error} Retorna error 500 para errores internos del servidor
 */
const baseHandler = async (event) => {
  try {
    const { name, email, phone, file, preview } = event.body;

    console.log("Event ==>", { name, email, phone, preview });

    // Validar campos requeridos
    const requiredFields = ["name", "email", "phone", "preview"];
    const missing = requiredFields.filter((f) => !event.body[f]);

    if (missing.length) {
      return unsuccessful(400, { message: `Faltan campos requeridos: ${missing.join(", ")}` }, ACTION);
    }

    if (!file || !file.content) {
      return unsuccessful(400, { message: "No se encontró archivo adjunto" }, ACTION);
    }

    const typeMessage = preview === '1' ? MESSAGE['preview'] : MESSAGE['confirmed'];

    // Preparar el contenido HTML del correo
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

    // Preparar el contenido de texto plano como alternativa
    const textContent = `
        Contrato de Viaje - Giras Indómito

        Estimado/a,

        Adjunto encontrará el contrato de viaje con la siguiente información:

        Nombre: ${name}
        Email: ${email}
        Teléfono: ${phone}

        Por favor, revise el documento adjunto y no dude en contactarnos si tiene alguna pregunta.

        Saludos cordiales,
        Equipo Giras Indómito

        ---
        Este es un correo automático, por favor no responder a esta dirección.
    `;

    // Preparar el adjunto
    // El contenido del archivo viene como Buffer desde multipartBodyParser
    const attachments = [{
      filename: file.filename,
      content: file.content,
      contentType: file.contentType || file.mimetype || 'application/pdf'
    }];

    // Enviar el correo con el adjunto
    const emailResult = await sendEmailWithAttachments({
      to: email,
      subject: `${typeMessage.subject}`,
      text: textContent,
      html: htmlContent,
      attachments: attachments
    });

    return success(200, {
      message: "Correo enviado exitosamente",
      messageId: emailResult.messageId,
      recipient: email
    }, ACTION);
  } catch (e) {
    console.error("ERROR ==>", e);
    const statusCode = e.statusCode || 500;
    return unsuccessful(statusCode, e, ACTION);
  }
};

/**
 * Handler principal compuesto para la función Lambda "send-notification-v1".
 *
 * Este export es el resultado de envolver `baseHandler` con middy y aplicar el
 * middleware `multipartBodyParser` configurado para procesar peticiones de tipo
 * multipart/form-data. El middleware utiliza busboy con un límite de tamaño por
 * archivo establecido en 10 MB (10 * 1024 * 1024 bytes).
 *
 * Propósito:
 * - Permitir el parseo automático de formularios multipart y la extracción de
 *   archivos y campos para que `baseHandler` los procese.
 * - Enviar correos electrónicos con archivos adjuntos (contratos) a los destinatarios.
 *
 * Comportamiento y notas:
 * - El límite `fileSize` se aplica por archivo individual.
 * - Mantiene la firma estándar de AWS Lambda (event, context, callback) que
 *   provee `baseHandler`.
 * - Para cambiar el límite máximo de subida, modificar la propiedad `fileSize`.
 *
 * @constant
 * @name main
 * @type {import('aws-lambda').Handler}
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