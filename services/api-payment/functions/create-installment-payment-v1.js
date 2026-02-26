import { WebpayPlus } from "transbank-sdk";
import { uuidv7 } from "uuidv7";
import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { configureTransbank } from "../utils/transbank.js";

const {
  STAGE,
  IS_OFFLINE,
  DYNAMODB_PAYMENT_TABLE,
} = process.env;

const FRONTEND_URL = IS_OFFLINE === "true"
  ? "http://localhost:4300"
  : STAGE === "dev"
    ? "https://d2q00w63koc9yz.cloudfront.net"
    : "https://d2e3zvke409odp.cloudfront.net";

// Timeout para pagos PENDING en minutos (después de este tiempo se consideran expirados)
const PENDING_TIMEOUT_MINUTES = 30;

/**
 * Crea una transacción de pago para una cuota específica de un programa.
 */
const handler = async (event) => {
  console.log("Event ==>", event);
  const action = "Crear pago de cuota de programa.";
  const data = event.body;
  const { programId, installmentNumber, amount, userId, payerEmail, returnUrl } = data;

  // Validaciones
  if (!programId) {
    const error = new Error('El programId es requerido.');
    error.statusCode = 400;
    throw error;
  }
  if (!installmentNumber || installmentNumber < 1) {
    const error = new Error('El installmentNumber debe ser mayor a 0.');
    error.statusCode = 400;
    throw error;
  }
  if (!amount || amount < 50) {
    const error = new Error('El monto debe ser mayor a 50 CLP.');
    error.statusCode = 400;
    throw error;
  }
  if (!userId) {
    const error = new Error('El userId es requerido.');
    error.statusCode = 400;
    throw error;
  }
  if (!payerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
    const error = new Error('El correo del pagador es requerido y debe ser válido.');
    error.statusCode = 400;
    throw error;
  }

  // Verificar si ya existe un pago para esta cuota
  const existingPaymentParams = {
    TableName: DYNAMODB_PAYMENT_TABLE,
    IndexName: "gsiOne-index",
    KeyConditionExpression: "gsiOne = :gsiOne",
    FilterExpression: "#status = :statusAuthorized OR #status = :statusPending",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":gsiOne": `${programId}#INST#${installmentNumber}`,
      ":statusAuthorized": "AUTHORIZED",
      ":statusPending": "PENDING",
    },
    Limit: 1,
  };

  const existingPayments = await dynamoDbLib.query(existingPaymentParams);

  if (existingPayments && existingPayments.length > 0) {
    const payment = existingPayments[0];

    if (payment.status === "AUTHORIZED") {
      const error = new Error('Esta cuota ya ha sido pagada exitosamente.');
      error.statusCode = 409;
      throw error;
    }

    if (payment.status === "PENDING") {
      const createdAt = new Date(payment.createdAt);
      const now = new Date();
      const minutesDiff = (now - createdAt) / (1000 * 60);

      if (minutesDiff < PENDING_TIMEOUT_MINUTES) {
        const error = new Error('Ya existe un pago en proceso para esta cuota. Por favor, espera unos minutos o completa el pago pendiente.');
        error.statusCode = 409;
        throw error;
      }

      // Pago PENDING antiguo: marcarlo como EXPIRED y permitir nuevo intento
      console.log(`Marcando pago ${payment.id} como EXPIRED (antigüedad: ${minutesDiff.toFixed(1)} minutos)`);
      await dynamoDbLib.update({
        TableName: DYNAMODB_PAYMENT_TABLE,
        Key: { pk: payment.pk, sk: payment.sk },
        UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":status": "EXPIRED",
          ":updatedAt": new Date().toISOString(),
        },
      });
    }
  }

  // Generar IDs
  const paymentId = uuidv7();
  const timestampShort = Date.now().toString().slice(-9);
  const programCode = programId.split('#')[1]?.slice(0, 6) || 'PROG';
  const buyOrder = `${programCode}-I${installmentNumber}-${timestampShort}`;
  const sessionId = `SESSION-${paymentId}`;
  const finalReturnUrl = returnUrl
    ? `${returnUrl}?programId=${encodeURIComponent(programId)}`
    : `${FRONTEND_URL}/app/cliente/pagos?programId=${encodeURIComponent(programId)}`;

  // Crear transacción en Transbank
  const options = await configureTransbank();
  const transaction = new WebpayPlus.Transaction(options);
  const response = await transaction.create(buyOrder, sessionId, amount, finalReturnUrl);

  console.log(`Transacción creada en Transbank. Token: ${response.token}, URL: ${response.url}`);

  const timestamp = new Date().toISOString();
  await dynamoDbLib.put({
    TableName: DYNAMODB_PAYMENT_TABLE,
    Item: {
      pk: `PAY#${paymentId}`,
      sk: `PAY#${programId}`,
      id: paymentId,
      programId,
      userId,
      payerEmail,
      installmentNumber,
      amount,
      status: "PENDING",
      transbankDetails: {
        token: response.token,
        buyOrder,
        sessionId,
        url: response.url,
        environment: process.env.TRANSBANK_ENVIRONMENT,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      gsiOne: `${programId}#INST#${installmentNumber}`,
      gsiTwo: userId,
      gsiThree: response.token,
    },
  });

  const result = {
    paymentId,
    token: response.token,
    url: response.url,
    buyOrder,
    amount,
  };

  console.log("Pago creado exitosamente:", JSON.stringify(result));

  return success(200, result, action);
};


export const main = standardMiddleware(handler);
