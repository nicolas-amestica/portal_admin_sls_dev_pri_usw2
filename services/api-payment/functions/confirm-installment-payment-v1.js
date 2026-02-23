import { WebpayPlus } from "transbank-sdk";
import {
  Options,
  IntegrationApiKeys,
  Environment,
  IntegrationCommerceCodes,
} from "transbank-sdk";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success } from "../../../helpers/responses";
import { getSecretManagerValue } from "../../../libs/secret-manager";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const {
  TRANSBANK_ENVIRONMENT,
  DYNAMODB_PAYMENT_TABLE,
  TRANSBANK_COMMERCE_CODE,
  TRANSBANK_API_KEY_SECRET,
} = process.env;

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
  return new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    Environment.Integration
  );
};

/**
 * Obtiene el registro de pago desde DynamoDB usando el token de Transbank.
 * Usa el GSI gsiThree-index para búsqueda eficiente (Query en lugar de Scan).
 *
 * @async
 * @param {string} token - Token de la transacción de Transbank
 * @returns {Promise<Object|null>} Registro del pago o null si no existe
 */
const getPaymentByToken = async (token) => {
  console.log(`🔍 Buscando pago con token usando GSI gsiThree-index (Query eficiente): ${token}`);

  const queryParams = {
    TableName: DYNAMODB_PAYMENT_TABLE,
    IndexName: "gsiThree-index",
    KeyConditionExpression: "gsiThree = :token",
    ExpressionAttributeValues: {
      ":token": token,
    },
    Limit: 1,
  };

  console.log("📋 Parámetros de Query:", JSON.stringify(queryParams, null, 2));

  const result = await dynamoDbLib.query(queryParams);

  if (result && result.length > 0) {
    console.log("✅ Pago encontrado exitosamente:", JSON.stringify({
      pk: result[0].pk,
      sk: result[0].sk,
      status: result[0].status,
      installmentNumber: result[0].installmentNumber,
      gsiThree: result[0].gsiThree,
      tokenMatch: result[0].gsiThree === token
    }));
    return result[0];
  }

  console.warn(`⚠️ No se encontró pago con token: ${token}`);
  return null;
};

/**
 * Confirma un pago de cuota tras la autorización de Transbank.
 *
 * Flujo:
 * 1. Valida el token del request.
 * 2. Busca el registro de pago en DynamoDB via GSI gsiThree-index.
 * 3. Llama a Transbank para hacer commit de la transacción.
 * 4. Actualiza el estado del pago en DynamoDB (AUTHORIZED o FAILED).
 * 5. Retorna el resumen del pago para que el frontend recargue las cuotas.
 */
const handler = async (event) => {
  const action = "Confirmar pago de cuota de programa.";
  const { token } = event.body || {};

  if (!token) {
    const error = new Error("El token de Transbank es requerido.");
    error.statusCode = 400;
    throw error;
  }

  // Buscar el registro de pago por token en DynamoDB
  const paymentRecord = await getPaymentByToken(token);

  if (!paymentRecord) {
    const error = new Error("No se encontró un pago para el token proporcionado.");
    error.statusCode = 404;
    throw error;
  }

  if (paymentRecord.status !== "PENDING") {
    const error = new Error(`El pago ya fue procesado con estado: ${paymentRecord.status}.`);
    error.statusCode = 409;
    throw error;
  }

  // Confirmar transacción con Transbank
  const options = await configureTransbank();
  const transaction = new WebpayPlus.Transaction(options);
  const transbankResponse = await transaction.commit(token);

  console.log("Respuesta de Transbank al confirmar:", JSON.stringify(transbankResponse, null, 2));

  const timestamp = new Date().toISOString();
  const isApproved = transbankResponse.response_code === 0;
  const newStatus = isApproved ? "AUTHORIZED" : "FAILED";

  // Actualizar el registro en DynamoDB con los datos del commit
  const updatedTransbankDetails = {
    ...paymentRecord.transbankDetails,
    vci: transbankResponse.vci || null,
    authorizationCode: transbankResponse.authorization_code || null,
    responseCode: transbankResponse.response_code ?? null,
    paymentTypeCode: transbankResponse.payment_type_code || null,
    accountingDate: transbankResponse.accounting_date || null,
    transactionDate: transbankResponse.transaction_date || null,
    cardNumber: transbankResponse.card_detail?.card_number || null,
    installmentsNumber: transbankResponse.installments_number || 0,
  };

  await dynamoDbLib.update({
    TableName: DYNAMODB_PAYMENT_TABLE,
    Key: {
      pk: paymentRecord.pk,
      sk: paymentRecord.sk,
    },
    UpdateExpression:
      "SET #status = :status, updatedAt = :updatedAt, paidAt = :paidAt, transbankDetails = :transbankDetails",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": newStatus,
      ":updatedAt": timestamp,
      ":paidAt": isApproved ? timestamp : null,
      ":transbankDetails": updatedTransbankDetails,
    },
  });

  if (!isApproved) {
    const error = new Error(
      `Pago rechazado por Transbank. Código de respuesta: ${transbankResponse.responseCode}.`
    );
    error.statusCode = 402;
    throw error;
  }

  const result = {
    paymentId: paymentRecord.id,
    programId: paymentRecord.programId,
    installmentNumber: paymentRecord.installmentNumber,
    status: newStatus,
    amount: paymentRecord.amount,
    authorizationCode: transbankResponse.authorization_code || null,
    cardNumber: transbankResponse.card_detail?.card_number || null,
    transactionDate: transbankResponse.transaction_date || null,
  };

  console.log("✅ Pago confirmado exitosamente:", JSON.stringify(result, null, 2));

  return success(200, result, action);
};

export const main = standardMiddleware(handler);
