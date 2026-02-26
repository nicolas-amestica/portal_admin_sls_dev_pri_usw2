import middy from "@middy/core";
import { CONTRACT } from '../constants/messages';
import { success, unsuccessful } from "../../../helpers/responses";
import multipartBodyParser from "@middy/http-multipart-body-parser";
import { sendEmailWithAttachments, generateEmailHTML } from '../../../libs/nodemailer';

const { STAGE } = process.env;
const ACTION = "Enviar notificación de contrato";
const MESSAGE = STAGE === 'dev' ? CONTRACT.dev : CONTRACT.prd;

const REQUIRED_FIELDS = ["name", "email", "preview", "file"];

/**
 * Obtiene el tipo de mensaje según el estado de la vista previa.
 */
const getTypeMessage = (preview) => {
  if (preview === '1') return MESSAGE.preview;
  if (preview === 'resend') return MESSAGE.resend;
  return MESSAGE.confirmed;
};

/**
 * Normaliza el contenido a un objeto Buffer.
 */
const normalizeBuffer = (content) => {
  if (Buffer.isBuffer(content)) return content;
  if (typeof content === 'string') return Buffer.from(content, 'base64');
  if (content?.type === 'Buffer' && Array.isArray(content.data)) return Buffer.from(content.data);
  return content;
};

/**
 * Procesa el envío de notificaciones por correo electrónico con archivos adjuntos.
 */
const baseHandler = async (event) => {
  const { name, email, file, preview } = event.body;

  const missing = REQUIRED_FIELDS.filter((f) => !event.body[f]);
  if (missing.length) return unsuccessful(400, { message: `Faltan campos requeridos: ${missing.join(", ")}` }, ACTION);

  if (!file?.content) {
    const error = new Error('No se encontró archivo adjunto');
    error.statusCode = 400;
    throw error;
  }

  const typeMessage = getTypeMessage(preview);

  const emailResult = await sendEmailWithAttachments({
    to: email,
    subject: typeMessage.subject,
    html: generateEmailHTML({ title: typeMessage.title, recipientName: name, bodyHtml: typeMessage.body }),
    attachments: [{
      filename: file.filename || 'contrato.pdf',
      content: normalizeBuffer(file.content),
      contentType: file.contentType || file.mimetype || 'application/pdf'
    }]
  });

  return success(200, { message: "Correo enviado exitosamente", messageId: emailResult.messageId, recipient: email }, ACTION);
};

export const main = middy(baseHandler).use(
  multipartBodyParser({ busboy: { limits: { fileSize: 10 * 1024 * 1024 } } })
);