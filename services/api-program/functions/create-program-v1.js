import { v4 as uuidv4 } from 'uuid';
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE_ID } = process.env;

export const main = async (event) => {
  console.log("event ==>", event);
  const action = "Creación de programa de viaje.";
  const { content } = JSON.parse(event.body);

  if (!content.type?.id) return unsuccessful(400, { message: "Falta el tipo de programa en la solicitud." }, action);

  const id = uuidv4();

  const params = {
      TableName: DYNAMODB_PROGRAM_TABLE,
      ReturnConsumedCapacity: 'TOTAL',
      Item: {
          pk: `PRG#${PROGRAM_TABLE_ID}`,
          sk: content.type.id === 'tour' ? `GIR#${id}` : `VJS#${id}`,
          id: id,
          createdAt: new Date().toISOString(),
          content: [content],
      },
  };

  await dynamoDbLib.put(params);

  try {
    return success(200, params, action);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};