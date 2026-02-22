import middy from "@middy/core";
import { CONTRACT } from '../constants/messages';
import { success, unsuccessful } from "../../../helpers/responses";
import multipartBodyParser from "@middy/http-multipart-body-parser";
import { sendEmailWithAttachments, generateEmailHTML } from '../../../libs/nodemailer';

const { STAGE } = process.env;
const ACTION = "Enviar notificación de contrato";
const MESSAGE = STAGE === 'dev' ? CONTRACT.dev : CONTRACT.prd;

/**
 * Manejador base para el envío de notificaciones por correo electrónico con archivo adjunto.
 */
const baseHandler = async (event) => {
  const { name, email, file, preview } = event.body;

  const requiredFields = ["name", "email", "preview", "file"];
  const missing = requiredFields.filter((f) => !event.body[f]);

  if (missing.length) return unsuccessful(400, { message: `Faltan campos requeridos: ${missing.join(", ")}` }, ACTION);

  if (!file || !file.content) {
    const error = new Error('No se encontró archivo adjunto');
    error.statusCode = 400;
    throw error;
  }

  const typeMessage = preview === '1' ? MESSAGE['preview']
    : preview === 'resend' ? MESSAGE['resend']
    : MESSAGE['confirmed'];

  const htmlContent = generateEmailHTML({
    title: typeMessage.title,
    recipientName: name,
    bodyHtml: typeMessage.body
  });

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
};

/**
 * Función principal del handler para enviar notificaciones.
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
