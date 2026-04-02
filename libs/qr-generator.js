import QRCode from 'qrcode';

/**
 * Genera un código QR como buffer PNG a partir de un objeto de datos.
 *
 * El objeto se serializa como JSON compacto. El QR resultante puede ser
 * embebido directamente en un PDF via pdf-lib usando pdfDoc.embedPng().
 *
 * @param {Object|string} data - Datos a codificar. Si es objeto, se serializa a JSON.
 * @param {Object} [options] - Opciones de personalización del QR.
 * @param {number} [options.width=150] - Ancho en píxeles del QR generado.
 * @param {string} [options.errorCorrectionLevel='M'] - Nivel de corrección de errores (L, M, Q, H).
 * @returns {Promise<Buffer>} Buffer PNG del código QR.
 */
export const generateQRCodeBuffer = async (data, options = {}) => {
  const { width = 150, errorCorrectionLevel = 'M' } = options;

  const text = typeof data === 'string' ? data : JSON.stringify(data);

  return QRCode.toBuffer(text, {
    type: 'png',
    width,
    margin: 1,
    errorCorrectionLevel,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
};

/**
 * Construye la URL pública de verificación para el QR de un comprobante de pago.
 *
 * Al escanear el QR, el cliente accede a una página web que muestra los detalles
 * del pago y confirma su validez.
 *
 * @param {string} paymentId  - ID único del pago
 * @param {string} baseUrl    - URL base del API Gateway (ej: https://xxx.execute-api.us-west-2.amazonaws.com)
 * @returns {string} URL completa de verificación
 */
export const buildPaymentVerificationUrl = (paymentId, baseUrl) =>
  `${baseUrl}/v1/pagos/verificar/${paymentId}`;

/**
 * Construye el payload JSON de respaldo para el QR (usado cuando no hay URL base disponible).
 *
 * @param {Object} params
 * @param {string} params.paymentId          - ID único del pago
 * @param {number} params.installmentNumber  - Número de cuota
 * @param {number} params.amount             - Monto pagado (CLP)
 * @param {string} params.method             - Método de pago (CASH | WEBPAY)
 * @param {string|null} params.transactionDate - Fecha ISO de la transacción
 * @returns {string} JSON compacto listo para codificar en QR
 */
export const buildPaymentQRPayload = ({ paymentId, installmentNumber, amount, method, transactionDate }) => {
  return JSON.stringify({
    id: paymentId,
    cuota: installmentNumber,
    monto: amount,
    metodo: method,
    fecha: transactionDate ?? null,
  });
};
