import middy from "@middy/core";
import { success, unsuccessful } from "../../../helpers/responses";
import { buildContractEmailData } from '../helpers/contract-email';
import multipartBodyParser from "@middy/http-multipart-body-parser";
import { sendEmail, sendEmailWithAttachments, generateEmailHTML } from '../../../libs/nodemailer';

const { STAGE } = process.env;
const ACTION = "Enviar notificación";

/**
 * Registro de tipos de notificación.
 * Cada entrada mapea un `type` a una función que recibe los parámetros específicos
 * del body y retorna { subject, title, bodyHtml }.
 *
 * Para agregar un nuevo tipo: crear su helper en ../helpers/ y registrarlo aquí.
 */
const EMAIL_BUILDERS = {
  contract: ({ preview }) => buildContractEmailData(preview, STAGE)
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
 * Handler genérico para envío de notificaciones por correo.
 *
 * Body esperado:
 *   - name         {string}  Nombre del destinatario
 *   - email        {string}  Correo del destinatario
 *   - type         {string}  Tipo de notificación (default: 'contract')
 *   - file         {object}  Archivo adjunto (opcional)
 *   - ...rest               Parámetros específicos del tipo (ej: preview para contratos)
 */
const baseHandler = async (event) => {
  const { name: recipientName, email: to, type = 'contract', file, ...typeParams } = event.body;

  if (!to || !recipientName) {
    return unsuccessful(400, { message: 'Los campos name y email son requeridos.' }, ACTION);
  }

  const builder = EMAIL_BUILDERS[type];
  if (!builder) return unsuccessful(400, { message: `Tipo de notificación no soportado: ${type}` }, ACTION);

  const { subject, title, bodyHtml } = builder(typeParams);
  const html = generateEmailHTML({ title, recipientName, bodyHtml });

  let emailResult;

  if (file?.content) {
    emailResult = await sendEmailWithAttachments({
      to,
      subject,
      html,
      attachments: [{
        filename: file.filename || 'adjunto.pdf',
        content: normalizeBuffer(file.content),
        contentType: file.contentType || file.mimetype || 'application/pdf'
      }]
    });
  } else {
    emailResult = await sendEmail({ to, subject, html });
  }

  return success(200, { message: "Correo enviado exitosamente", messageId: emailResult.messageId, recipient: to }, ACTION);
};

export const main = middy(baseHandler).use(
  multipartBodyParser({ busboy: { limits: { fileSize: 10 * 1024 * 1024 } } })
);
