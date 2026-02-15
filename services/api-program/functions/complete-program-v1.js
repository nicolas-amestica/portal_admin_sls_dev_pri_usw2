import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const {
  PROGRAM_TABLE,
  DYNAMODB_PROGRAM_TABLE
} = process.env;
const ACTION = "Completar el programa.";

const handler = async (event) => {    // event.body ya está parseado por middleware
    const { sk } = event.body;

    if (!sk) {
      const error = new Error('Falta el identificador del programa en la solicitud.');
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
      const error = new Error('Programa no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    let program = programs[0];

    program.status = 'completed';
    program.updatedAt = new Date().toISOString();
    await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

    return success(200, program, ACTION);
};

export const main = standardMiddleware(handler);
