import middy from "@middy/core";
import { CONTRACT } from '../constants/messages';
import { success, unsuccessful } from "../../../helpers/responses";
import multipartBodyParser from "@middy/http-multipart-body-parser";
import { sendEmailWithAttachments } from '../../../libs/nodemailer';

const { STAGE } = process.env;

const ACTION = "Enviar notificación de contrato";

const MESSAGE = STAGE === 'dev' ? CONTRACT.dev : CONTRACT.prd;

const baseHandler = async (event) => {
  try {
    const { name, email, phone, file, preview } = event.body;

    const requiredFields = ["name", "email", "phone", "preview", "file"];
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

export const main = middy(baseHandler).use(
  multipartBodyParser({
    busboy: {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    },
  })
);