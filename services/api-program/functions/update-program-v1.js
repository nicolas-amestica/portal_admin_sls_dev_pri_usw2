import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_PROGRAM_TABLE } = process.env;
const ACTION = "Actualización del programa.";

/**
 * Construye el objeto actualizado del programa para almacenar en DynamoDB.
 */
const buildProgramUpdate = ({ pk, sk, id, createdAt, content, user }) => ({
  pk,
  sk,
  id,
  createdAt,
  updatedAt: new Date().toISOString(),
  content,
  status: 'pending',
  priority: 1,
  user,
  type: content[0].type.id,
  startDate: content[0].dates[0].split('T')[0],
});

/**
 * Handler principal para actualizar los datos de un programa.
 */
const handler = async (event) => {
  const { content, sk, pk, id, createdAt, user } = event.body;

  if (!sk) {
    const error = new Error('Falta el identificador del programa en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  const program = buildProgramUpdate({ pk, sk, id, createdAt, content, user });
  const result = await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

  return success(200, result, ACTION);
};

export const main = standardMiddleware(handler);
