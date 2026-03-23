import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { validateFinancialData } from "../helpers/fn-validate-financial-data.js";

const { DYNAMODB_PROGRAM_TABLE } = process.env;
const ACTION = "Actualización del programa.";

/**
 * Construye el objeto actualizado del programa para almacenar en DynamoDB.
 */
const buildProgramUpdate = ({ pk, sk, id, createdAt, content, user, sii }) => ({
  pk,
  sk,
  id,
  createdAt,
  updatedAt: new Date().toISOString(),
  content,
  status: 'pending',
  priority: 1,
  user,
  sii,
  type: content[0].type.id,
  startDate: content[0].dates[0].split('T')[0],
});

/**
 * Handler principal para actualizar los datos de un programa.
 */
const handler = async (event) => {
  const { content, sk, pk, id, createdAt, user, sii } = event.body;

  if (!sk) {
    const error = new Error('Falta el identificador del programa en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  if (!content?.[0]) {
    const error = new Error('El contenido del programa es requerido.');
    error.statusCode = 400;
    throw error;
  }

  const financialValidation = validateFinancialData(content[0]);
  if (!financialValidation.valid) {
    const error = new Error(financialValidation.error);
    error.statusCode = 400;
    throw error;
  }

  const program = buildProgramUpdate({ pk, sk, id, createdAt, content, user, sii });
  const result = await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

  return success(200, result, ACTION);
};

export const main = standardMiddleware(handler);
