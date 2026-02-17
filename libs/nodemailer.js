import nodemailer from 'nodemailer';
import { getAWSConfigs } from './configs';
import { getSecretManagerValue } from './secret-manager.js';

let transporter;

/**
 * Genera el contenido HTML con formato estándar para los correos de Giras Indómito.
 * Esta es una función completamente genérica que solo renderiza el HTML.
 * El contenido específico (body HTML) debe ser construido por el servicio que la llama.
 *
 * @function
 * @param {Object} params - Parámetros para generar el HTML del correo.
 * @param {string} params.title - Título del correo que aparece en el header.
 * @param {string} params.recipientName - Nombre del destinatario.
 * @param {string} params.bodyHtml - Cuerpo HTML completo del mensaje (puede incluir divs, estilos inline, etc).
 * @param {string} [params.footerText] - Texto del footer (por defecto: mensaje de correo automático).
 * @param {string} [params.logoUrl] - URL del logo de la empresa (opcional).
 * @param {boolean} [params.useCidLogo] - Si usar CID para el logo (default: false).
 * @returns {string} Contenido HTML formateado del correo.
 */
export const generateEmailHTML = ({ title, recipientName, bodyHtml, footerText, logoUrl, useCidLogo = false }) => {
  const defaultFooterText = 'Este es un correo automático, por favor no responder a esta dirección.';
  const defaultLogoUrl = logoUrl || 'https://giras-indomito-dev-info.s3.us-west-2.amazonaws.com/assets/logo-gi.png';

  // Si useCidLogo es true, usar el CID en lugar de la URL
  const logoSrc = useCidLogo ? 'cid:logo-giras-indomito' : defaultLogoUrl;

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
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
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .logo-container {
            margin-bottom: 20px;
          }
          .logo {
            max-width: 180px;
            height: auto;
          }
          .header-title {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
          .credential-item {
            margin: 10px 0;
            font-size: 14px;
          }
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
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            transition: transform 0.2s;
          }
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
          }
          .closing {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
          }
          .signature {
            color: #1e3a8a;
            font-weight: 600;
            margin-top: 10px;
          }
          .footer {
            background-color: #f9fafb;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer-text {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 10px;
          }
          .social-links {
            margin-top: 15px;
          }
          .social-links a {
            color: #3b82f6;
            text-decoration: none;
            margin: 0 10px;
            font-size: 13px;
          }
          @media only screen and (max-width: 600px) {
            .email-wrapper {
              border-radius: 0;
            }
            .header, .content, .footer {
              padding: 25px 20px;
            }
            .logo {
              max-width: 150px;
            }
            .header-title {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <!-- Header con gradiente -->
          <div class="header">
            <div class="logo-container">
              <img src="${logoSrc}" alt="Giras Indómito" class="logo">
            </div>
            <h1 class="header-title">${title}</h1>
          </div>

          <!-- Contenido principal -->
          <div class="content">
            <p class="greeting">Estimado/a ${recipientName},</p>

            <div class="message-body">
              ${bodyHtml}
            </div>

            <div class="closing">
              <p style="color: #4b5563;">Saludos cordiales,</p>
              <p class="signature">Equipo Giras Indómito</p>
              <p style="color: #6b7280; font-size: 13px; margin-top: 5px;">
                📧 info@girasindomito.cl<br>
                🌐 www.girasindomito.cl
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p class="footer-text">${footerText || defaultFooterText}</p>
            <p class="footer-text" style="margin-top: 10px;">
              © ${new Date().getFullYear()} Giras Indómito. Todos los derechos reservados.
            </p>
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
const { EMAIL_CONFIG_SECRET_KEY } = process.env;

const initTransporter = async () => {
  await getAWSConfigs();

  const secretValue = await getSecretManagerValue(EMAIL_CONFIG_SECRET_KEY);
  const emailConfig = JSON.parse(secretValue);

  transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password
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
      from: options.from || 'Giras Indómito Ltda. <no-reply@girasindomito.cl>',
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
