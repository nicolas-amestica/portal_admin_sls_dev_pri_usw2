import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

export const main = async (event) => {
  console.log("event ==>", event);
  const action = "Obtención de lista de programas en sistema.";
  const { year } = event.queryStringParameters;
  const { type } = event.pathParameters;

  try {
    if (!type)
      return unsuccessful(
        400,
        { message: "Faltan el tipo de programa en la solicitud." },
        action
      );
    if (!year)
      return unsuccessful(
        400,
        { message: "Faltan el año en la solicitud." },
        action
      );

    const pk = PROGRAM_TABLE;
    const sk = type === "viaje" ? "VJS#" : type === "gira" ? "GIR#" : null;

    if (!sk)
      return unsuccessful(
        400,
        { message: "Ha ingresado un tipo de programa no válido." },
        action
      );

    const params = {
      TableName: DYNAMODB_PROGRAM_TABLE,
      IndexName: "gsiStartDate-index",
      ReturnConsumedCapacity: "TOTAL",
      KeyConditionExpression: "#pk = :pk And begins_with(#startDate, :startDate)",
      ExpressionAttributeValues: {
        ':pk': pk,
        ":startDate": year,
      },
      ExpressionAttributeNames: {
        '#pk': 'pk',
        "#startDate": "startDate"
      },
    };

    const result = await dynamoDbLib.query(params);

    const programs =
      !result || result.length === 0
        ? []
        : result.map((item) => ({
            sk: item.sk,
            status: item.status,
            type: item.content[0].type.id,
            school: item.content[0].school,
            course: item.content[0].course,
            season: item.content[0].season,
            representativeName: item.content[0].representative.name,
            startDate: item.content[0].dates[0],
          }));

    return success(200, programs, action);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};
