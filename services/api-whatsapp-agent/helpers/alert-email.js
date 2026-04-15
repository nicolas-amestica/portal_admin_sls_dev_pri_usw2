import nodemailer from 'nodemailer';
import { getParameterValue } from '../../../libs/parameter-store.js';
import { generateEmailHTML } from '../../../libs/nodemailer.js';

/** Cache del transporter en memoria (reutilizado entre invocaciones en caliente). */
let _transporter = null;

/** @type {Record<string, string>} Etiquetas legibles por canal. */
const CHANNEL_LABELS = {
  whatsapp: 'WhatsApp',
  messenger: 'Messenger',
  instagram: 'Instagram',
};

/**
 * @description Obtiene o inicializa el transporter Nodemailer con la cuenta
 * agente@work.girasindomito.cl via Google Workspace SMTP.
 * @returns {Promise<import('nodemailer').Transporter>}
 */
async function getTransporter() {
  if (_transporter) return _transporter;
  const secretJson = await getParameterValue(process.env.WHATSAPP_AGENT_EMAIL_CONFIG_SECRET_KEY);
  const { host, port, secure, user, password } = JSON.parse(secretJson);
  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass: password },
  });
  return _transporter;
}

/**
 * @description Envía un email de alerta al equipo cuando el agente no puede responder un mensaje.
 * Usa la cuenta agente@work.girasindomito.cl como emisor y receptor (alias agente-whatsapp@).
 *
 * @param {string} phoneNumber - Número o ID del cliente.
 * @param {string} userText - Mensaje original del cliente.
 * @param {'sin_presupuesto'|'sin_respuesta'|'error_gemini'} reason - Motivo por el que no se respondió.
 * @param {string} channel - Canal de origen ('whatsapp', 'messenger', 'instagram').
 * @param {string} [errorDetail] - Detalle del error, solo para reason='error_gemini'.
 */
export async function sendAlertEmail(phoneNumber, userText, reason, channel, errorDetail) {
  const reasonLabel = reason === 'sin_presupuesto'
    ? 'No se encontró presupuesto disponible'
    : reason === 'sin_respuesta'
      ? 'Consulta fuera del alcance del agente'
      : 'Error en el agente de IA (Gemini)';

  const channelLabel = CHANNEL_LABELS[channel] ?? channel;

  // Botón de acción rápida según el canal.
  const waNumber = phoneNumber.replace(/\D/g, '');
  const actionButton = channel === 'whatsapp'
    ? `<div style="text-align:center;margin-top:24px;">
        <a href="https://wa.me/${waNumber}"
           style="display:inline-flex;align-items:center;gap:10px;background-color:#25D366;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;box-shadow:0 4px 12px rgba(37,211,102,0.35);">
          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
               alt="WhatsApp" width="22" height="22"
               style="display:inline-block;vertical-align:middle;">
          Responder en WhatsApp
        </a>
      </div>`
    : '';

  const bodyHtml = `
    <p>El agente no pudo responder un mensaje y requiere atención manual.</p>
    <div class="credentials-box">
      <h3>Detalles del mensaje</h3>
      <div class="credential-item">
        <span class="credential-label">Plataforma:</span>
        <span class="credential-value">${channelLabel}</span>
      </div>
      <div class="credential-item">
        <span class="credential-label">Número / ID:</span>
        <span class="credential-value">${phoneNumber}</span>
      </div>
      <div class="credential-item">
        <span class="credential-label">Mensaje:</span>
        <span class="credential-value">${userText ?? '(sin texto)'}</span>
      </div>
      <div class="credential-item">
        <span class="credential-label">Motivo:</span>
        <span class="credential-value">${reasonLabel}</span>
      </div>
      ${errorDetail ? `<div class="credential-item">
        <span class="credential-label">Error:</span>
        <span class="credential-value">${errorDetail}</span>
      </div>` : ''}
    </div>
    ${actionButton}
    <p style="margin-top:20px;">Por favor, responde al cliente directamente desde ${channelLabel}.</p>
  `;

  const transporter = await getTransporter();
  await transporter.sendMail({
    from: `Giras Indómito Agente <agente@work.girasindomito.cl>`,
    to: process.env.ALERT_EMAIL,
    subject: `Agente ${channelLabel} — Mensaje sin responder de ${phoneNumber}`,
    html: generateEmailHTML({ recipientName: 'Equipo Giras Indómito', bodyHtml }),
  });
}
