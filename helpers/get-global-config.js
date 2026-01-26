import * as dynamoDbLib from "../libs/dynamodb-v3.js";

const CONFIG_PK = "CONFIG";
const CONFIG_SK = "GLOBAL";

/**
 * Obtiene la configuración global desde DynamoDB.
 *
 * @async
 * @function getGlobalConfig
 * @param {string} tableName - Nombre de la tabla DynamoDB de configuración.
 * @returns {Promise<Object>} Configuración global con ivaRateCrew e ivaRateService.
 *
 * @description
 * Obtiene la configuración global desde DynamoDB.
 * Si no existe configuración, retorna valores por defecto:
 * - ivaRateCrew: 0.1525 (15.25%)
 * - ivaRateService: 0.19 (19%)
 */
export const getGlobalConfig = async (tableName) => {
  try {
    const params = {
      TableName: tableName,
      Key: {
        pk: CONFIG_PK,
        sk: CONFIG_SK,
      },
    };

    const result = await dynamoDbLib.getOne(params);

    if (!result || !result.Item) {
      // Valores por defecto si no existe configuración
      return {
        ivaRateCrew: 0.1525,
        ivaRateService: 0.19,
      };
    }

    return {
      ivaRateCrew: result.Item.ivaRateCrew || 0.1525,
      ivaRateService: result.Item.ivaRateService || 0.19,
    };
  } catch (error) {
    console.error("Error obteniendo configuración global:", error);
    // Retornar valores por defecto en caso de error
    return {
      ivaRateCrew: 0.1525,
      ivaRateService: 0.19,
    };
  }
};
