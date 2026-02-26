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

/**
 * Crea una nueva transacción de pago con Transbank Webpay Plus (legacy).
 * Para nuevos pagos, usar POST /v1/pagos/cuotas/crear.
 */
const handler = async (event) => {
  console.log("Event ==>", event);
  const action = "Crear transacción de pago.";
  const data = event.body;
  const { amount, orderId, userId, description } = data;

  if (!amount || amount < 50) {
    const error = new Error('El monto debe ser mayor a 50 CLP.');
    error.statusCode = 400;
    throw error;
  }

  const transactionId = uuidv7();
  const buyOrder = orderId || `ORDER-${Date.now()}`;
  const sessionId = `SESSION-${Date.now()}`;
  const returnUrl = `${FRONTEND_URL}/app/cliente/pagos/resultado`;

  const options = await configureTransbank();
  const transaction = new WebpayPlus.Transaction(options);
  const response = await transaction.create(buyOrder, sessionId, amount, returnUrl);

  const timestamp = new Date().toISOString();
  await dynamoDbLib.put({
    TableName: DYNAMODB_PAYMENT_TABLE,
    Item: {
      pk: `PAYMENT#${transactionId}`,
      sk: `METADATA`,
      transactionId,
      token: response.token,
      buyOrder,
      sessionId,
      amount,
      userId: userId || null,
      description: description || null,
      status: "PENDING",
      transbankUrl: response.url,
      returnUrl,
      environment: process.env.TRANSBANK_ENVIRONMENT,
      createdAt: timestamp,
      updatedAt: timestamp,
      gsiOne: buyOrder,
      gsiTwo: userId || "GUEST",
    },
  });

  const result = {
    transactionId,
    token: response.token,
    url: response.url,
    buyOrder,
    amount,
  };

  return success(200, result, action);
};

export const main = standardMiddleware(handler);
