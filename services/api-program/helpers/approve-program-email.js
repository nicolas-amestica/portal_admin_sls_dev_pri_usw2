/**
 * URLs del portal según el ambiente
 */
const PORTAL_URLS = {
  dev: 'https://d2q00w63koc9yz.cloudfront.net/auth/login',
  prd: 'https://d2e3zvke409odp.cloudfront.net/auth/login'
};

/**
 * Genera el cuerpo HTML del email de aprobación de contrato
 * @param {string} username - Usuario para acceder al portal
 * @param {string} password - Contraseña temporal
 * @param {string} portalUrl - URL del portal según ambiente
 * @returns {string} HTML formateado del cuerpo del email
 */
const buildApprovedProgramBody = (username, password, portalUrl) => `
  <p style="margin-bottom: 20px;">¡Nos complace informarle que su contrato ha sido generado exitosamente!</p>

  <p style="margin-bottom: 20px;">Adjunto a este correo encontrará el documento PDF con todos los detalles de su contrato.</p>

  <div class="credentials-box">
    <h3>🔐 Credenciales de Acceso al Portal</h3>
    <div class="credential-item">
      <span class="credential-label">Correo:</span>
      <span class="credential-value">${username}</span>
    </div>
    <div class="credential-item">
      <span class="credential-label">Contraseña:</span>
      <span class="credential-value">${password}</span>
    </div>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${portalUrl}" class="cta-button">Acceder al Portal</a>
  </div>

  <p style="margin-bottom: 15px;"><strong>Próximos pasos:</strong></p>
  <ol style="margin-left: 20px; margin-bottom: 20px; color: #4b5563;">
    <li style="margin-bottom: 8px;">Acceda a nuestro portal usando el botón de arriba.</li>
    <li style="margin-bottom: 8px;">Ingrese con las credenciales proporcionadas.</li>
    <li style="margin-bottom: 8px;">Por seguridad, cambie su contraseña temporal por una de su preferencia.</li>
    <li style="margin-bottom: 8px;">Explore las funcionalidades disponibles para gestionar su programa.</li>
  </ol>

  <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
    Por favor, revise el documento adjunto y no dude en contactarnos si tiene alguna pregunta.
  </p>

  <p style="margin-top: 20px;">Estamos emocionados de acompañarle en esta experiencia inolvidable.</p>
`;

export const APPROVED_PROGRAM = {
    dev: {
        title: "Contrato Generado",
        subject: "Desarrollo | ¡Felicitaciones! Su Contrato ha sido generado - Giras Indómito",
        portalUrl: PORTAL_URLS.dev,
        buildBody: (username, password) => buildApprovedProgramBody(username, password, PORTAL_URLS.dev)
    },
    prd: {
        title: "Contrato Generado",
        subject: "¡Felicitaciones! Su Contrato ha sido generado - Giras Indómito",
        portalUrl: PORTAL_URLS.prd,
        buildBody: (username, password) => buildApprovedProgramBody(username, password, PORTAL_URLS.prd)
    }
};
