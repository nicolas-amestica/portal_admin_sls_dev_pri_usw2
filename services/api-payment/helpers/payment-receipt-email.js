const formatCLP = (amount) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

/**
 * Genera el cuerpo HTML del email de comprobante de pago.
 *
 * @param {Object} params
 * @param {number} params.installmentNumber  - Número de cuota pagada
 * @param {number} params.amount             - Monto pagado (CLP)
 * @param {string|null} params.authorizationCode - Código de autorización Transbank
 * @returns {string} HTML formateado del cuerpo del email
 */
const buildPaymentReceiptBody = ({ installmentNumber, amount, authorizationCode }) => `
  <p style="margin-bottom: 20px;">Tu pago ha sido procesado exitosamente. Adjunto encontrarás tu comprobante en formato PDF.</p>

  <div class="credentials-box">
    <h3>Resumen del Pago</h3>
    <div class="credential-item">
      <span class="credential-label">Cuota N°:</span>
      <span class="credential-value">${installmentNumber}</span>
    </div>
    <div class="credential-item">
      <span class="credential-label">Monto:</span>
      <span class="credential-value">${formatCLP(amount)}</span>
    </div>
    <div class="credential-item">
      <span class="credential-label">Autorización:</span>
      <span class="credential-value">${authorizationCode || 'N/A'}</span>
    </div>
  </div>

  <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
    Guarda este comprobante como respaldo de tu transacción. No dudes en contactarnos si tienes alguna consulta.
  </p>
`;

export const PAYMENT_RECEIPT = {
  dev: {
    title: 'DEV | Comprobante de Pago',
    buildSubject: (installmentNumber) => `DEV | Comprobante de Pago - Cuota #${installmentNumber} | Giras Indómito`,
    buildBody: (params) => buildPaymentReceiptBody(params)
  },
  prd: {
    title: 'Comprobante de Pago',
    buildSubject: (installmentNumber) => `Comprobante de Pago - Cuota #${installmentNumber} | Giras Indómito`,
    buildBody: (params) => buildPaymentReceiptBody(params)
  }
};
