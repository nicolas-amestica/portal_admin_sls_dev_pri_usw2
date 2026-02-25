import { uuidv7 } from "uuidv7";
import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;
const ACTION = "Creación de programa.";

/**
 * Construye el objeto de programa para almacenar en DynamoDB.
 */
const buildProgram = (content, user) => {
  const id = uuidv7();
  const firstContent = content[0];
  return {
    pk: PROGRAM_TABLE,
    sk: `PRG#${id}`,
    id,
    priority: 1,
    createdAt: new Date().toISOString(),
    content,
    user,
    status: 'pending',
    type: firstContent.type.id,
    startDate: firstContent.dates[0].split('T')[0],
    sii: firstContent.sii,
  };
};

/**
 * Handler principal para crear un nuevo programa.
 */
const handler = async (event) => {
  const { content, user } = event.body;

  if (!content?.[0]) {
    const error = new Error('El contenido del programa es requerido.');
    error.statusCode = 400;
    throw error;
  }

  const firstContent = content[0];

  if (!firstContent.type?.id) {
    const error = new Error('Falta el tipo de programa en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  if (!firstContent.dates?.[0]) {
    const error = new Error('La fecha de inicio es requerida.');
    error.statusCode = 400;
    throw error;
  }

  const program = buildProgram(content, user);
  const result = await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

  return success(200, result, ACTION);
};

export const main = standardMiddleware(handler);
