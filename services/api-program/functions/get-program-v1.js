import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE_ID } = process.env;

export const main = async (event) => {
  console.log("event ==>", event);
  const action = "Obtención de lista de programas en sistema.";
  const queryParams = event.queryStringParameters;

  try {
    if (!queryParams) return unsuccessful(400, { message: "Faltan los queryParameters en la solicitud." }, action);

    const sk = queryParams.sk;
    if (!sk) return unsuccessful(400, { message: "Identificador de programa inválido." }, action);

    const pk = `PRG#${PROGRAM_TABLE_ID}`;

    const params = {
      TableName: DYNAMODB_PROGRAM_TABLE,
      ReturnConsumedCapacity: 'TOTAL',
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': sk,
      },
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sk': 'sk'
      }
    };

   const result = await dynamoDbLib.query(params);

    return success(200, result, action, queryParams);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};