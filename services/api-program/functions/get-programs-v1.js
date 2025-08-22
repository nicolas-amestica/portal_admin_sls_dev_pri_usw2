import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE_ID } = process.env;

export const main = async (event) => {
  console.log("event ==>", event);
  const action = "Obtención de lista de programas de gira de estudios.";
  const queryParams = event.queryStringParameters;

  const pk = `PRG#${PROGRAM_TABLE_ID}`;
  const sk = `GIR#`;

  const params = {
    TableName: DYNAMODB_PROGRAM_TABLE,
    ReturnConsumedCapacity: 'TOTAL',
    KeyConditionExpression: '#pk = :pk And begins_with(#sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': pk,
      ':sk': sk,
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
    },
  };

  try {
    const result = await dynamoDbLib.query(params);
    return success(200, result, action, queryParams);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};