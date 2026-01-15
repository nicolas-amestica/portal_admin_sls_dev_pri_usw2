import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";
import { parseEventBody } from '../../../helpers/event-parser.js';

const {
  PROGRAM_TABLE,
  DYNAMODB_PROGRAM_TABLE
} = process.env;
const ACTION = "Completar el programa.";

export const main = async (event) => {
  try {
    const body = parseEventBody(event);
    const { sk } = body;

    if (!sk) return unsuccessful(400, { message: "Falta el identificador del programa en la solicitud." }, ACTION);

    const programs = await dynamoDbLib.query({
      TableName: DYNAMODB_PROGRAM_TABLE,
      KeyConditionExpression: '#pk = :pk AND #sk = :sk',
      ExpressionAttributeValues: { ':pk': PROGRAM_TABLE, ':sk': sk },
      ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' }
    });

    if (!programs || programs.length === 0) return unsuccessful(404, { message: "Programa no encontrado." }, ACTION);

    let program = programs[0];

    program.status = 'completed';
    program.updatedAt = new Date().toISOString();
    await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

    return success(200, program, ACTION);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, ACTION);
  }
};