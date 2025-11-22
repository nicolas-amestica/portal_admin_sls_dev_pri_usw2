import { uuidv7 } from "uuidv7";
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;
const ACTION = "Aprobar/Rechazar programa.";

/**
 * Objeto que contiene funciones manejadoras para diferentes estados de contrato.
 *
 * @type {Object.<string, Function>}
 * @property {Function} approved - Función que maneja el estado aprobado del contrato.
 *   Actualiza el contenido del programa con los datos del contrato, generando un nuevo ID UUID v7
 *   y estableciendo las marcas de tiempo de creación y actualización.
 *   @param {Object} program - El objeto programa a modificar
 *   @param {Object} contract - El objeto contrato con los datos a agregar
 *   @param {string|Date} now - La marca de tiempo actual para createdAt y updatedAt
 *
 * @property {Function} rejected - Función que maneja el estado rechazado del contrato.
 *   Asigna la razón de rechazo al programa.
 *   @param {Object} program - El objeto programa a modificar
 *   @param {string} rejectReason - La razón por la cual el contrato fue rechazado
 */
const STATUS_HANDLERS = {
  approved: (program, contract, now) => {
    program.content[0] = {
      ...program.content[0],
      contract: { ...contract, id: uuidv7(), createdAt: now, updatedAt: now }
    };
  },
  rejected: (program, rejectReason) => {
    program.rejectReason = rejectReason;
  }
};

/**
 * Función principal para gestionar la actualización de estado de un contrato de programa.
 *
 * @async
 * @function main
 * @param {Object} event - Evento de AWS Lambda que contiene la información de la solicitud
 * @param {string} event.body - Cuerpo de la solicitud en formato JSON string
 * @param {string} event.body.sk - Sort key del programa en DynamoDB
 * @param {Object} event.body.contract - Objeto con los datos del contrato (opcional)
 * @param {Object} event.body.status - Objeto que contiene el estado del programa
 * @param {string} event.body.status.id - ID del nuevo estado del programa
 * @param {string} event.body.rejectReason - Razón de rechazo del contrato (opcional)
 * @returns {Promise<Object>} Respuesta HTTP con el programa actualizado o mensaje de error
 * @returns {number} returns.statusCode - Código de estado HTTP (200, 400, 404, 500)
 * @returns {Object} returns.body - Cuerpo de la respuesta con el programa actualizado o error
 * @throws {Error} Retorna error 400 si el estado actual no es 'pending'
 * @throws {Error} Retorna error 404 si el programa no es encontrado
 * @throws {Error} Retorna error 500 para errores internos del servidor
 */
export const main = async (event) => {
  try {
    const { sk, contract, status, rejectReason } = JSON.parse(event.body);

    const [program] = await dynamoDbLib.query({
      TableName: DYNAMODB_PROGRAM_TABLE,
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
      ExpressionAttributeValues: { ':pk': PROGRAM_TABLE, ':sk': sk },
      ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' }
    });

    if (!program) return unsuccessful(404, { message: "Programa no encontrado." }, ACTION);

    if (program.status !== 'pending')
      return unsuccessful(400, { message: "Actualización de estado no permitido ya que el estado actual no es 'pending'." }, ACTION);

    const now = new Date().toISOString();
    Object.assign(program, { status: status.id, updatedAt: now });

    STATUS_HANDLERS[status.id]?.(program, contract || rejectReason, now);

    await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

    return success(200, program, ACTION);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, ACTION);
  }
};