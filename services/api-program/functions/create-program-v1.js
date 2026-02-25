import { uuidv7 } from "uuidv7";
import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;
const ACTION = "Creación de programa de viaje.";

/**
 * Función principal para crear un nuevo programa en la base de datos.
 *
 * @async
 * @function main
 * @param {Object} event - Evento de AWS Lambda que contiene el cuerpo de la solicitud.
 * @param {string} event.body - Cuerpo del evento en formato JSON string.
 * @returns {Promise<Object>} Respuesta HTTP con el resultado de la operación.
 * @returns {number} returns.statusCode - Código de estado HTTP (200 para éxito, 400/500 para errores).
 * @returns {Object} returns.body - Datos del programa creado o mensaje de error.
 *
 * @throws {Error} Retorna error 400 si el contenido del programa no está presente.
 * @throws {Error} Retorna error 400 si falta el tipo de programa en la solicitud.
 * @throws {Error} Retorna error 400 si la fecha de inicio no está presente.
 * @throws {Error} Retorna error 500 para errores internos del servidor.
 *
 * @description
 * Esta función realiza las siguientes operaciones:
 * 1. Parsea el cuerpo del evento para extraer el contenido y usuario.
 * 2. Valida que exista contenido en el programa.
 * 3. Valida que exista un tipo de programa.
 * 4. Valida que exista al menos una fecha de inicio.
 * 5. Genera un ID único utilizando uuidv7.
 * 6. Crea un registro en DynamoDB con el programa y su información.
 * 7. Retorna una respuesta exitosa con los datos del programa creado.
 */
const handler = async (event) => {
  const { content, user } = event.body;

  if (!content?.[0]) {
    const error = new Error('El contenido del programa es requerido.')
    error.statusCode = 400;
    throw error;
  }

  const firstContent = content[0];

  if (!firstContent.type?.id) {
    const error = new Error('Falta el tipo de programa en la solicitud.')
    error.statusCode = 400;
    throw error;
  }

  if (!firstContent.dates?.[0]) {
    const error = new Error('La fecha de inicio es requerida.')
    error.statusCode = 400;
    throw error;
  }

  const id = uuidv7();
  const createdAt = new Date().toISOString();
  const startDate = firstContent.dates[0].split('T')[0];

  const result = await dynamoDbLib.put({
    TableName: DYNAMODB_PROGRAM_TABLE,
    ReturnConsumedCapacity: 'TOTAL',
    Item: {
      pk: PROGRAM_TABLE,
      sk: `PRG#${id}`,
      id,
      priority: 1,
      createdAt,
      content,
      user,
      status: 'pending',
      type: firstContent.type.id,
      startDate,
      sii: content[0].sii
    },
  });

  return success(200, result, ACTION);
};

export const main = standardMiddleware(handler);
