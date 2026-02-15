import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_PROGRAM_TABLE } = process.env;
const ACTION = "Actualización del programa.";

const handler = async (event) => {    const { content, sk, pk, id, createdAt, user } = event.body;

    if (!sk) {
      const error = new Error('Falta el tipo de programa en la solicitud.')
      error.statusCode = 400;
      throw error;
    }
    throw error;

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
};

export const main = standardMiddleware(handler);
