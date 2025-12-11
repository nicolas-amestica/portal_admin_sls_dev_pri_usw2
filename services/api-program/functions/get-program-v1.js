import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

export const main = async (event) => {
  const action = "Obtención de programa en sistema.";
  const { sk } = event.queryStringParameters || {};

  try {
    if (!sk) return unsuccessful(400, { message: "Identificador de programa no encontrado en request." }, action);

    const [result] = await dynamoDbLib.query({
      TableName: DYNAMODB_PROGRAM_TABLE,
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
      ExpressionAttributeValues: {
        ':pk': PROGRAM_TABLE,
        ':sk': sk,
      },
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sk': 'sk'
      }
    });

    return success(200, result, action);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, action);
  }
};
