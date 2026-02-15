import { WebpayPlus } from "transbank-sdk";
import {
  Options,
  IntegrationApiKeys,
  Environment,
  IntegrationCommerceCodes,
} from "transbank-sdk";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success, unsuccessful } from "../../../helpers/responses";
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
 * Obtiene el registro de transacción desde DynamoDB usando el token.
 *
 * @async
 * @param {string} token - Token de la transacción de Transbank
 * @returns {Promise<Object|null>} Registro de la transacción o null si no existe
 */
const getTransactionByToken = async (token) => {
  const params = {
    TableName: DYNAMODB_PAYMENT_TABLE,
    IndexName: "token-index", // Necesitarás crear este GSI
    KeyConditionExpression: "#token = :token",
    ExpressionAttributeNames: {
      "#token": "token",
    },
    ExpressionAttributeValues: {
      ":token": token,
    },
    Limit: 1,
  };    const result = await dynamoDbLib.query(params);
    return result && result.length > 0 ? result[0] : null;
};


export const main = standardMiddleware(handler);
