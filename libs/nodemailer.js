import nodemailer from 'nodemailer';
import { getAWSConfigs } from './configs';
import { getParameterValue } from './parameter-store.js';

let transporter;

/**
 * Genera el HTML estándar para correos de Giras Indómito.
 * @param {Object} params
 * @param {string} params.recipientName - Nombre del destinatario.
 * @param {string} params.bodyHtml - Cuerpo HTML del mensaje.
 * @param {string} [params.footerText] - Texto del footer.
 */
const getFromAddress = () => {
  const stage = process.env.STAGE;
  const alias = stage === 'prd' ? 'no-reply' : 'no-reply-dev';
  return `Giras Indómito <${alias}@girasindomito.cl>`;
};

const getAssetUrl = (asset) => {
  const stage = process.env.STAGE || 'dev';
  return `https://giras-indomito-${stage}-info.s3.us-west-2.amazonaws.com/assets/${asset}`;
};

export const generateEmailHTML = ({ recipientName, bodyHtml, footerText }) => {
  const defaultFooterText = 'Este es un correo automático, por favor no responder a esta dirección.';
  const year = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f7f9;
            padding: 20px;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          .header {
            background: url('${getAssetUrl('header.png')}') center/cover no-repeat;
            text-align: center;
            height: 160px;
          }
          .content {
            padding: 40px 30px;
            background-color: #ffffff;
          }
          .greeting {
            font-size: 18px;
            color: #1e3a8a;
            margin-bottom: 20px;
            font-weight: 500;
          }
          .message-body {
            color: #4b5563;
            font-size: 15px;
            line-height: 1.8;
            margin-bottom: 20px;
          }
          .credentials-box {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
          }
          .credentials-box h3 {
            color: #1e3a8a;
            font-size: 16px;
            margin-bottom: 15px;
            font-weight: 600;
          }
          .credential-item { margin: 10px 0; font-size: 14px; }
          .credential-label {
            font-weight: 600;
            color: #1e40af;
            display: inline-block;
            min-width: 100px;
          }
          .credential-value {
            color: #374151;
            font-family: 'Courier New', monospace;
            background-color: #ffffff;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #bfdbfe;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            margin: 20px 0;
            box-shadow: 0 4px 12px rgba(59,130,246,0.3);
          }
          .closing {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
          }
          .signature { color: #1e3a8a; font-weight: 600; margin-top: 10px; }
          .footer { text-align: center; }
          .footer-text { font-size: 11px; color: #6b7280; }
          @media only screen and (max-width: 600px) {
            .email-wrapper { border-radius: 0; }
            .content { padding: 25px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header"></div>

          <div class="content">
            <p class="greeting">Estimado/a ${recipientName},</p>
            <div class="message-body">${bodyHtml}</div>
            <div class="closing">
              <p style="color: #4b5563;">Saludos cordiales,</p>
              <p class="signature">Equipo Giras Indómito</p>
              <p style="color: #6b7280; font-size: 13px; margin-top: 5px;">
                📧 info@girasindomito.cl<br>
                🌐 www.girasindomito.cl
              </p>
            </div>
          </div>

          <div class="footer">
            <p class="footer-text">${footerText || defaultFooterText}</p>
            <p class="footer-text" style="margin-top: 4px;">
              © ${year} Giras Indómito. Todos los derechos reservados.
            </p>
            <img
              src="${getAssetUrl('footer.png')}"
              alt=""
              style="width: 100%; display: block; margin-top: 5px;"
            >
          </div>
        </div>
      </body>
    </html>
  `;
};

const initTransporter = async () => {
  await getAWSConfigs();

  const secretValue = await getParameterValue(process.env.EMAIL_CONFIG_SECRET_KEY);
  const { host, port, secure, user, password } = JSON.parse(secretValue);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass: password },
    tls: { rejectUnauthorized: false }
  });
};

/**
 * Envía un correo electrónico.
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} [options.text]
 * @param {string} [options.html]
 * @param {string} [options.from]
 */
export const sendEmail = async ({ to, subject, text, html, from }) => {
  if (!transporter) await initTransporter();

  return transporter.sendMail({
    from: from || getFromAddress(),
    to,
    subject,
    text,
    html,
  });
};

/**
 * Envía un correo con adjuntos.
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} [options.text]
 * @param {string} [options.html]
 * @param {string} [options.from]
 * @param {Array<{filename: string, content: Buffer|string, contentType?: string, encoding?: string}>} options.attachments
 */
export const sendEmailWithAttachments = async ({ to, subject, text, html, from, attachments }) => {
  if (!attachments?.length) throw new Error('Se requiere al menos un archivo adjunto.');
  if (!transporter) await initTransporter();

  return transporter.sendMail({
    from: from || getFromAddress(),
    to,
    subject,
    text,
    html,
    attachments,
  });
};