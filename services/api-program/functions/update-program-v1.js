import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PROGRAM_TABLE } = process.env;

export const main = async (event) => {
  console.log("event ==>", event);
  const action = "Actualización del programa de viaje.";
  const { content, sk, pk, id, createdAt } = JSON.parse(event.body);

  if (!sk) return unsuccessful(400, { message: "Falta el tipo de programa en la solicitud." }, action);

  try {
    const program = {
        pk: pk,
        sk: sk,
        id: id,
        createdAt: createdAt,
        updatedAt: new Date().toISOString(),
        content: content
    };

    const params = {
        TableName: DYNAMODB_PROGRAM_TABLE,
        ReturnConsumedCapacity: 'TOTAL',
        Item: program
    };
    const result = await dynamoDbLib.put(params);

    return success(200, result, action);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};