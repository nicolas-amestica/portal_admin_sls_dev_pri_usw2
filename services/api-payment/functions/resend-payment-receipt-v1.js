import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { generatePaymentReceipt, PAYMENT_RECEIPT } from '../../../libs/document-builders/index.js';
import { loadImages } from '../../../libs/pdf-generator/index.js';
import { sendEmailWithAttachments, generateEmailHTML } from '../../../libs/nodemailer.js';

const { STAGE, DYNAMODB_PAYMENT_TABLE, BUCKET_INFO_GI, VERIFY_BASE_URL } = process.env;

const MESSAGE = STAGE === 'prd' ? PAYMENT_RECEIPT.prd : PAYMENT_RECEIPT.dev;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Busca un pago en DynamoDB por su ID.
 * Usa query por pk porque el sk contiene el programId (desconocido aquí).
 *
 * @param {string} paymentId - ID del pago (sin prefijo PAY#)
 * @returns {Promise<Object|null>} El registro de pago o null si no existe
 */
const fetchPaymentById = async (paymentId) => {
  const items = await dynamoDbLib.query({
    TableName: DYNAMODB_PAYMENT_TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': `PAY#${paymentId}` },
    Limit: 1,
  });
  return items?.[0] ?? null;
};

/**
 * Genera el PDF del comprobante y lo envía por correo al destinatario indicado.
 *
 * @param {{ payment: Object, recipientEmail: string }} params
 */
const buildAndSendReceipt = async ({ payment, recipientEmail }) => {
  const { headerImage, footerImage } = await loadImages(
    BUCKET_INFO_GI,
    'assets/header.png',
    'assets/footer.png'
  );

  const pdfBuffer = await generatePaymentReceipt({
    paymentId: payment.id,
    installmentNumber: payment.installmentNumber,
    amount: payment.amount,
    authorizationCode: payment.transbankDetails?.authorizationCode ?? null,
    cardNumber: payment.transbankDetails?.cardNumber ?? null,
    transactionDate: payment.paidAt ?? payment.createdAt,
    buyOrder: payment.transbankDetails?.buyOrder ?? null,
    payerEmail: recipientEmail,
    method: payment.method ?? 'CASH',
    verifyBaseUrl: VERIFY_BASE_URL || null,
    headerImageBase64: headerImage,
    footerImageBase64: footerImage,
  });

  const bodyHtml = MESSAGE.buildBody({
    installmentNumber: payment.installmentNumber,
    amount: payment.amount,
    authorizationCode: payment.transbankDetails?.authorizationCode ?? null,
  });

  const html = generateEmailHTML({ recipientName: recipientEmail, bodyHtml });

  await sendEmailWithAttachments({
    to: recipientEmail,
    subject: MESSAGE.buildSubject(payment.installmentNumber),
    html,
    attachments: [{
      filename: `comprobante-cuota-${payment.installmentNumber}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  });
};

/**
 * Reenvía el comprobante de pago generado al email indicado por el administrador.
 *
 * Permite que el administrador reenvíe un comprobante existente a un correo
 * diferente al original, por ejemplo cuando el cliente reporta que no lo recibió.
 *
 * Flujo:
 * 1. Valida paymentId y recipientEmail
 * 2. Obtiene el pago desde DynamoDB
 * 3. Verifica que el pago esté en estado AUTHORIZED
 * 4. Genera el comprobante PDF y lo envía al recipientEmail
 *
 * @example
 * POST /v1/pagos/admin/reenviar-comprobante
 * Body JSON: { "paymentId": "...", "recipientEmail": "cliente@ejemplo.com" }
 */
const handler = async (event) => {
  const action = 'Reenviar comprobante de pago.';
  const { paymentId, recipientEmail } = event.body || {};

  if (!paymentId?.trim()) {
    const error = new Error('El paymentId es requerido.');
    error.statusCode = 400;
    throw error;
  }

  if (!recipientEmail?.trim()) {
    const error = new Error('El email del destinatario es requerido.');
    error.statusCode = 400;
    throw error;
  }

  if (!EMAIL_REGEX.test(recipientEmail.trim())) {
    const error = new Error('El email del destinatario no tiene un formato válido.');
    error.statusCode = 400;
    throw error;
  }

  const payment = await fetchPaymentById(paymentId.trim());

  if (!payment) {
    const error = new Error('Pago no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  if (payment.status !== 'AUTHORIZED') {
    const error = new Error('Solo se pueden reenviar comprobantes de pagos autorizados.');
    error.statusCode = 409;
    throw error;
  }

  await buildAndSendReceipt({ payment, recipientEmail: recipientEmail.trim() });

  console.log(`[resend-payment-receipt] paymentId=${paymentId} enviado a: ${recipientEmail.trim()}`);

  return success(200, { paymentId: paymentId.trim(), recipientEmail: recipientEmail.trim() }, action);
};

export const main = standardMiddleware(handler);
