import { WebpayPlus } from "transbank-sdk";
import {
  Options,
  IntegrationApiKeys,
  Environment,
  IntegrationCommerceCodes,
} from "transbank-sdk";
import { uuidv7 } from "uuidv7";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success, unsuccessful } from "../../../helpers/responses";
import { getSecretManagerValue } from "../../../libs/secret-manager";

const {
  TRANSBANK_ENVIRONMENT,
  DYNAMODB_PAYMENT_TABLE,
  TRANSBANK_COMMERCE_CODE,
  TRANSBANK_API_KEY_SECRET,
  TRANSBANK_KEYS,
  STAGE
} = process.env;

const FRONTEND_URL = STAGE !== "prd" ? "https://d2q00w63koc9yz.cloudfront.net" : "";

/**
 * Configura las opciones de Transbank según el ambiente.
 *
 * @async
 * @returns {Promise<Options>} Opciones configuradas para Transbank
 */
const configureTransbank = async () => {
  if (TRANSBANK_ENVIRONMENT === "production") {
    const apiKey = await getSecretManagerValue(TRANSBANK_API_KEY_SECRET);
    return new Options(TRANSBANK_COMMERCE_CODE, apiKey, Environment.Production);
  }
  // Ambiente de integración
  return new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    Environment.Integration
  );
};

/**
 * Crea una nueva transacción de pago con Transbank Webpay Plus.
 *
 * @async
 * @function
 * @param {Object} event - Objeto de evento recibido de API Gateway.
 * @param {string} event.body - Cuerpo de la solicitud en formato JSON, debe incluir `amount`, `orderId` (opcional), `userId` (opcional), y `description` (opcional).
 * @returns {Promise<Object>} Respuesta HTTP con el token y URL de pago, o un mensaje de error.
 *
 * @description
 * Este método:
 * 1. Valida que el monto sea mayor a 50 CLP (mínimo de Transbank).
 * 2. Genera un buyOrder único si no se proporciona.
 * 3. Crea la transacción en Transbank.
 * 4. Guarda el registro inicial en DynamoDB.
 * 5. Retorna el token y URL para redirección al formulario de pago.
 */
export const main = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));
  const action = "Crear transacción de pago.";

  console.log("STAGE ==>", STAGE);
  console.log("TRANSBANK_KEYS ==>", TRANSBANK_KEYS);

  try {
    const data = JSON.parse(event.body);
    const { amount, orderId, userId, description } = data;

    // Validaciones
    if (!amount || amount < 50) return unsuccessful(400, { message: "El monto debe ser mayor a 50 CLP." }, action);

    // Generar identificadores únicos
    const transactionId = uuidv7();
    const buyOrder = orderId || `ORDER-${Date.now()}`;
    const sessionId = `SESSION-${Date.now()}`;
    const returnUrl = `${FRONTEND_URL}/app/cliente/pagos/resultado`;

    // Configurar y crear transacción en Transbank
    const options = await configureTransbank();
    const transaction = new WebpayPlus.Transaction(options);
    const response = await transaction.create(buyOrder, sessionId, amount, returnUrl);

    // Guardar registro inicial en DynamoDB
    const timestamp = new Date().toISOString();
    const params = {
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
        environment: TRANSBANK_ENVIRONMENT,
        createdAt: timestamp,
        updatedAt: timestamp,
        gsiOne: buyOrder, // Para búsqueda por orden de compra
        gsiTwo: userId || "GUEST", // Para búsqueda por usuario
      },
    };

    await dynamoDbLib.put(params);

    const result = {
      transactionId,
      token: response.token,
      url: response.url,
      buyOrder,
      amount,
    };

    return success(200, result, action);
  } catch (error) {
    console.error("Error al crear transacción:", error);
    let statusCode = error.statusCode || 500;
    return unsuccessful(statusCode, { message: error.message || "Error al crear transacción." }, action);
  }
};
