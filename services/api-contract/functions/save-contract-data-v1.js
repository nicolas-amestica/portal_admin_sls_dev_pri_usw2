import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;
const ACTION = "Guardar datos del contrato en el programa.";

/**
 * Manejador de Lambda que guarda datos de contrato en un programa específico.
 * 
 * @async
 * @function handler
 * @param {Object} event - Evento de entrada de Lambda
 * @param {Object} event.body - Cuerpo de la solicitud
 * @param {string} event.body.sk - Identificador único del programa (clave de ordenamiento)
 * @param {Object} event.body.contract - Datos del contrato a guardar
 * 
 * @returns {Promise<Object>} Respuesta de éxito con el programa actualizado
 * @returns {number} 200 - Código de estado HTTP de éxito
 * @returns {Object} Objeto del programa actualizado con los datos del contrato
 * 
 * @throws {Error} Si falta el identificador (sk) - Error 400
 * @throws {Error} Si el programa no existe - Error 404
 * 
 * @description
 * Esta función realiza las siguientes operaciones:
 * 1. Valida que se proporcione el identificador del programa (sk)
 * 2. Busca el programa en DynamoDB utilizando la clave primaria y secundaria
 * 3. Actualiza el contenido del programa con los datos del contrato
 * 4. Persiste los cambios en la base de datos
 * 5. Devuelve el programa actualizado
 */
const handler = async (event) => {
  const { sk, contract } = event.body;

  if (!sk) {
    const error = new Error("Falta el identificador del programa en la solicitud.");
    error.statusCode = 400;
    throw error;
  }

  const programs = await dynamoDbLib.query({
    TableName: DYNAMODB_PROGRAM_TABLE,
    KeyConditionExpression: '#pk = :pk AND #sk = :sk',
    ExpressionAttributeValues: { ':pk': PROGRAM_TABLE, ':sk': sk },
    ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' }
  });

  if (!programs || programs.length === 0) {
    const error = new Error("Programa no encontrado.");
    error.statusCode = 404;
    throw error;
  }

  let program = programs[0];

  program.content[0] = {
    ...program.content[0],
    contract: {
      ...contract,
    }
  };

  await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

  return success(200, program, ACTION);
};

export const main = standardMiddleware(handler);