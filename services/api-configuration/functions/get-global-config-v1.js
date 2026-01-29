import { success, unsuccessful } from "../../../helpers/responses.js";
import { getGlobalConfig } from "../../../helpers/get-global-config.js";

const { DYNAMODB_CONFIG_TABLE } = process.env;
const ACTION = "Obtener configuración global";

/**
 * Handler para obtener configuración global.
 *
 * @async
 * @function main
 * @param {Object} event - AWS Lambda event.
 * @returns {Promise<Object>} HTTP response.
 *
 * @description
 * Flujo:
 * 1. Obtener configuración global de DynamoDB.
 * 2. Retornar respuesta normalizada con ivaRateCrew e ivaRateService.
 */
export const main = async (event) => {
  try {
    const globalConfig = await getGlobalConfig(DYNAMODB_CONFIG_TABLE);

    return success(
      200,
      {
        success: true,
        data: globalConfig,
      },
      ACTION,
    );
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return unsuccessful(statusCode, error, ACTION);
  }
};
