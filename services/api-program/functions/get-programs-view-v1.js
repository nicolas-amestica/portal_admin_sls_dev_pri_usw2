import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE_ID } = process.env;

export const main = async (event) => {
  console.log("event ==>", event);
  const action = "Obtención de lista de programas en sistema.";
  const queryParams = event.queryStringParameters;

  try {
    if (!event.pathParameters) return unsuccessful(400, { message: "Faltan los pathParameters en la solicitud." }, action);
    const pathParameters = event.pathParameters.type;

    const pk = `PRG#${PROGRAM_TABLE_ID}`;
    const sk = pathParameters === 'viaje' ? 'VJS#' : pathParameters === 'gira' ? 'GIR#' : null;

    if (!sk) return unsuccessful(400, { message: "Ha ingresado un tipo de programa no válido." }, action);

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

    const programs = (!result || result.length === 0) ? [] : result.map(item => ({
      sk: item.sk,
      status: item.status,
      type: item.content[0].type.id,
      school: item.content[0].school,
      course: item.content[0].course,
      season: item.content[0].season,
      representativeName: item.content[0].representative.name,
      startDate: item.content[0].dates[0]
    }));

    return success(200, programs, action, queryParams);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};