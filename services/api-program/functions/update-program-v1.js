import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PROGRAM_TABLE } = process.env;

export const main = async (event) => {
  const action = "Actualización del programa de viaje.";
  const { content, sk, pk, id, createdAt, status, user } = JSON.parse(event.body);

  if (!sk) return unsuccessful(400, { message: "Falta el tipo de programa en la solicitud." }, action);

  try {
    const program = {
        pk: pk,
        sk: sk,
        id: id,
        createdAt: createdAt,
        updatedAt: new Date().toISOString(),
        content: content,
        status: status,
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

    return success(200, result, action);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, action);
  }
};