import { uuidv7 } from "uuidv7";
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE_ID } = process.env;

export const main = async (event) => {
  console.log("event ==>", event);
  const action = "Creación de programa de viaje.";
  const { content, user } = JSON.parse(event.body);

  if (!content[0].type?.id) return unsuccessful(400, { message: "Falta el tipo de programa en la solicitud." }, action);

  try {
    const id = uuidv7();
    const params = {
        TableName: DYNAMODB_PROGRAM_TABLE,
        ReturnConsumedCapacity: 'TOTAL',
        Item: {
            pk: `PRG#${PROGRAM_TABLE_ID}`,
            sk: content[0].type.id === 'tour' ? `GIR#${id}` : `VJS#${id}`,
            id: id,
            createdAt: new Date().toISOString(),
            content: content,
            user: user,
            status: 'pending',
            type : content[0].type.id,
            startDate: content[0].dates[0].split('T')[0],
        },
    };

    const result = await dynamoDbLib.put(params);

    return success(200, result, action);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};