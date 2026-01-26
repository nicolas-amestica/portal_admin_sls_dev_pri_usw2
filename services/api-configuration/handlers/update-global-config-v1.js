import * as dynamoDbLib from "../../../libs/dynamodb-v3.js";
import { success, unsuccessful } from "../../../helpers/responses.js";
import { validateGlobalConfig } from "../validators/validate-global-config.js";

const { DYNAMODB_CONFIG_TABLE } = process.env;
const CONFIG_PK = "CONFIG";
const CONFIG_SK = "GLOBAL";
const ACTION = "Actualizar configuración global";

/**
 * Handler para actualizar configuración global (solo Admin).
 *
 * @async
 * @function main
 * @param {Object} event - AWS Lambda event.
 * @param {string} event.body - JSON string con ivaRateCrew e ivaRateService.
 * @returns {Promise<Object>} HTTP response.
 *
 * @description
 * Flujo:
 * 1. Parsear body del evento.
 * 2. Validar payload (ivaRateCrew, ivaRateService).
 * 3. Persistir en DynamoDB.
 * 4. Retornar respuesta normalizada.
 */
export const main = async (event) => {
  try {
    const data = JSON.parse(event.body);

    // Validar payload
    validateGlobalConfig(data);

    const { ivaRateCrew, ivaRateService } = data;

    // Persistir en DynamoDB
    const params = {
      TableName: DYNAMODB_CONFIG_TABLE,
      ReturnConsumedCapacity: "TOTAL",
      Item: {
        pk: CONFIG_PK,
        sk: CONFIG_SK,
        ivaRateCrew,
        ivaRateService,
        updatedAt: new Date().toISOString(),
      },
    };

    await dynamoDbLib.put(params);

    return success(
      200,
      {
        success: true,
        message: "Configuración global actualizada correctamente",
      },
      ACTION,
    );
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return unsuccessful(statusCode, error, ACTION);
  }
};
