import { WebpayPlus } from "transbank-sdk";
import {
  Options,
  IntegrationApiKeys,
  Environment,
  IntegrationCommerceCodes,
} from "transbank-sdk";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
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
const getPaymentByToken = async (token) => {    console.log(`🔍 Buscando pago con token usando GSI gsiThree-index (Query eficiente): ${token}`);

    // Usar Query con GSI gsiThree para búsqueda eficiente (O(1) vs O(n) del Scan)
    const queryParams = {
      TableName: DYNAMODB_PAYMENT_TABLE,
      IndexName: "gsiThree-index", // GSI para buscar por token de Transbank
      KeyConditionExpression: "gsiThree = :token",
      ExpressionAttributeValues: {
        ":token": token,
      },
      Limit: 1, // Solo necesitamos un resultado (el token es único)
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


export const main = standardMiddleware(handler);
