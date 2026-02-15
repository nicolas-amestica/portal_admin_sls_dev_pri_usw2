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
import { standardMiddleware } from "../../../libs/middleware/index.js";

const {
  STAGE,
  IS_OFFLINE,
  TRANSBANK_ENVIRONMENT,
  DYNAMODB_PAYMENT_TABLE,
  TRANSBANK_COMMERCE_CODE,
  TRANSBANK_API_KEY_SECRET,
} = process.env;

const FRONTEND_URL = IS_OFFLINE
  ? "http://localhost:4300" // local
  : STAGE === "dev"
    ? "https://d2q00w63koc9yz.cloudfront.net" // development
    : "https://d2e3zvke409odp.cloudfront.net/"; // production

// Timeout para pagos PENDING en minutos (después de este tiempo se consideran expirados)
const PENDING_TIMEOUT_MINUTES = 30;

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
 * Crea una transacción de pago para una cuota específica de un programa.
 *
 * @async
 * @function
 * @param {Object} event - Objeto de evento recibido de API Gateway.
 * @param {string} event.body - Cuerpo de la solicitud en formato JSON
 * @param {string} event.body.programId - ID del programa (sk)
 * @param {number} event.body.installmentNumber - Número de la cuota
 * @param {number} event.body.amount - Monto de la cuota
 * @param {string} event.body.userId - ID del usuario que realiza el pago
 * @param {string} [event.body.returnUrl] - URL de retorno después del pago (opcional, se usa FRONTEND_URL si no se proporciona)
 * @returns {Promise<Object>} Respuesta HTTP con el token y URL de pago, o un mensaje de error.
 *
 * @description
 * Este método:
 * 1. Valida que todos los campos requeridos estén presentes.
 * 2. Verifica que el monto sea mayor a 50 CLP (mínimo de Transbank).
 * 3. Verifica que no exista ya un pago para esta cuota del programa.
 * 4. Genera un paymentId único y crea la transacción en Transbank.
 * 5. Guarda el registro inicial en DynamoDB con estructura optimizada.
 * 6. Retorna el paymentId, token y URL para redirección al formulario de pago.
 */
const handler = async (event) => {
  console.log(event);
  const action = "Crear pago de cuota de programa.";    const data = event.body;
    const { programId, installmentNumber, amount, userId, returnUrl } = data;

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

    // Verificar si ya existe un pago para esta cuota
    const existingPaymentParams = {
      TableName: DYNAMODB_PAYMENT_TABLE,
      IndexName: "gsiOne-index", // GSI para buscar por programId#installmentNumber
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

    // Verificar si hubo un error
    if (existingPayments instanceof Error) {
      throw existingPayments;
    }

    if (existingPayments && existingPayments.length > 0) {
      const payment = existingPayments[0];

      // Si el pago ya fue autorizado, no permitir duplicados
      if (payment.status === "AUTHORIZED") {
        const error = new Error('Esta cuota ya ha sido pagada exitosamente.');
    error.statusCode = 409;
    throw error;
      }

      // Si el pago está pendiente, verificar antigüedad
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
          Key: {
            pk: payment.pk,
            sk: payment.sk
          },
          UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status"
          },
          ExpressionAttributeValues: {
            ":status": "EXPIRED",
            ":updatedAt": new Date().toISOString()
          }
        });
        // Continuar con la creación del nuevo pago
      }
    }

    // Generar IDs
    const paymentId = uuidv7();
    // Límite de 26 caracteres para buyOrder de Transbank
    const timestampShort = Date.now().toString().slice(-9); // Últimos 9 dígitos
    const programCode = programId.split('#')[1]?.slice(0, 6) || 'PROG';
    const buyOrder = `${programCode}-I${installmentNumber}-${timestampShort}`;
    const sessionId = `SESSION-${paymentId}`;
    // Usar returnUrl proporcionado por el frontend o fallback a FRONTEND_URL
    // Incluir programId en URL de retorno para recargar el programa después del pago
    // Nota: Transbank automáticamente añade ?token_ws={TOKEN} al returnUrl, no lo incluimos aquí
    const finalReturnUrl = returnUrl
      ? `${returnUrl}?programId=${encodeURIComponent(programId)}`
      : `${FRONTEND_URL}/app/cliente/pagos?programId=${encodeURIComponent(programId)}`;

    // Crear transacción en Transbank
    const options = await configureTransbank();
    const transaction = new WebpayPlus.Transaction(options);
    const response = await transaction.create(buyOrder, sessionId, amount, finalReturnUrl);

    console.log(`Transacción creada en Transbank. Token: ${response.token}, URL: ${response.url}`);

    // Guardar registro en DynamoDB con nueva estructura
    const timestamp = new Date().toISOString();
    const params = {
      TableName: DYNAMODB_PAYMENT_TABLE,
      Item: {
        // Keys
        pk: `PAY#${paymentId}`,
        sk: `PAY#${programId}`,

        // Identificadores
        id: paymentId,
        programId,
        userId,
        installmentNumber,

        // Monto y estado
        amount,
        status: "PENDING",

        // Transbank
        transbankDetails: {
          token: response.token,
          buyOrder,
          sessionId,
          url: response.url,
          environment: TRANSBANK_ENVIRONMENT,
        },

        // Metadata
        createdAt: timestamp,
        updatedAt: timestamp,

        // GSI
        gsiOne: `${programId}#INST#${installmentNumber}`, // Para buscar por programa + cuota
        gsiTwo: userId, // Para buscar por usuario
        gsiThree: response.token, // Para buscar por token de Transbank (búsqueda eficiente en confirm)
      },
    };

    await dynamoDbLib.put(params);

    console.log(`✅ Pago guardado en DynamoDB exitosamente`);
    console.log(`  PaymentId: ${paymentId}`);
    console.log(`  Token completo: ${response.token}`);
    console.log(`  PK: PAY#${paymentId}`);
    console.log(`  SK: PAY#${programId}`);
    console.log(`  GSI gsiOne: ${programId}#INST#${installmentNumber}`);
    console.log(`  Estructura transbankDetails.token verificada: ${params.Item.transbankDetails.token === response.token}`);

    const result = {
      paymentId,
      token: response.token,
      url: response.url,
      buyOrder,
      amount,
    };

    console.log("Pago creado exitosamente. Resultado:", JSON.stringify(result, null, 2));

    return success(200, result, action);
};


export const main = standardMiddleware(handler);
