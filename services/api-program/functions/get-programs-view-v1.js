import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

export const main = async (event) => {
  console.log("event ==>", event);
  const action = "Obtener programas por periodo en sistema.";
  const { periodo } = event.queryStringParameters;

  try {
    if (!periodo) return unsuccessful(400, { message: "Faltan el periodo en la solicitud." }, action);

    const params = {
      TableName: DYNAMODB_PROGRAM_TABLE,
      IndexName: "gsiStartDate-index",
      ReturnConsumedCapacity: "TOTAL",
      KeyConditionExpression: "#pk = :pk And begins_with(#startDate, :startDate)",
      ExpressionAttributeValues: {
        ':pk': PROGRAM_TABLE,
        ":startDate": periodo,
      },
      ExpressionAttributeNames: {
        '#pk': 'pk',
        "#startDate": "startDate"
      },
    };

    const result = await dynamoDbLib.query(params);

    const programs = result?.map(({ sk, status, content }) => ({
      sk,
      status,
      type: content[0].type.id,
      school: content[0].school,
      course: content[0].course,
      season: content[0].season,
      representativeName: content[0].representative.name,
      startDate: content[0].dates[0],
    })) ?? [];

    return success(200, programs, action);
  } catch (e) {
    return unsuccessful(e.statusCode ?? 500, e, action);
  }
};
