import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PROGRAM_TABLE } = process.env;
const ACTION = "Actualización del programa.";

export const main = async (event) => {
  try {
    const { content, sk, pk, id, createdAt, user } = parseEventBody(event);

    if (!sk) return unsuccessful(400, { message: "Falta el tipo de programa en la solicitud." }, ACTION);

    const program = {
        pk: pk,
        sk: sk,
        id: id,
        createdAt: createdAt,
        updatedAt: new Date().toISOString(),
        content: content,
        status: 'pending',
        user: user,
        type : content[0].type.id,
        startDate: content[0].dates[0].split('T')[0],
    };

    const params = {
        TableName: DYNAMODB_PROGRAM_TABLE,
        ReturnConsumedCapacity: 'TOTAL',
        Item: program
    };
    const result = await dynamoDbLib.put(params);

    return success(200, result, ACTION);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, ACTION);
  }
};