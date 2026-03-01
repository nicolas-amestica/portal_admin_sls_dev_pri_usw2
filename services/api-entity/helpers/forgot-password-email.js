/**
 * Genera el cuerpo HTML del email de recuperación de contraseña.
 *
 * @param {string} resetUrl - URL para restablecer la contraseña.
 * @returns {string} HTML formateado del cuerpo del email.
 */
const buildForgotPasswordBody = (resetUrl) => `
  <p style="margin-bottom: 20px;">
    Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Portal Administrativo de Giras Indómito.
  </p>

  <p style="margin-bottom: 20px;">Para crear una nueva contraseña, haz clic en el siguiente botón:</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" class="cta-button">Restablecer Contraseña</a>
  </div>

  <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
    Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:
  </p>
  <p style="background: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #374151;">
    ${resetUrl}
  </p>

  <div style="margin-top: 25px; padding: 15px; background: #fef9c3; border-left: 4px solid #eab308; border-radius: 8px;">
    <p style="color: #713f12; font-size: 13px; margin: 0;">
      <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por razones de seguridad.
      Si no solicitaste este cambio, ignora este correo — tu contraseña permanecerá sin cambios.
      Nunca compartas este enlace con nadie.
    </p>
  </div>
`;

export const FORGOT_PASSWORD = {
  dev: {
    title: 'Recuperación de Contraseña',
    subject: 'Desarrollo | Recuperación de Contraseña - Giras Indómito',
    buildBody: (resetUrl) => buildForgotPasswordBody(resetUrl)
  },
  prd: {
    title: 'Recuperación de Contraseña',
    subject: 'Recuperación de Contraseña - Giras Indómito',
    buildBody: (resetUrl) => buildForgotPasswordBody(resetUrl)
  }
};
