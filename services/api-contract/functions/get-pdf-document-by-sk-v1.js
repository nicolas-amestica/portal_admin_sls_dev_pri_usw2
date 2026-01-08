import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success, unsuccessful } from "../../../helpers/responses.js";

const {
  // BUCKET_INFO_GI,
  PROGRAM_TABLE,
  DYNAMODB_PROGRAM_TABLE
} = process.env;

export const main = async (event) => {
  // console.log("Event ==>", JSON.stringify(event, null, 2));
  const action = "Obtener archivo PDF del documento.";

  try {
    const { sk } = event.queryStringParameters;

    if (!sk) return unsuccessful(400, { message: 'Falta el identificador del documento.' }, action);

    const params = {
      TableName: DYNAMODB_PROGRAM_TABLE,
      ReturnConsumedCapacity: 'TOTAL',
      KeyConditionExpression: '#pk = :pk AND #sk = :sk',
      ExpressionAttributeValues: {
        ':pk': PROGRAM_TABLE,
        ':sk': sk,
      },
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sk': 'sk'
      }
    };

    const results = await dynamoDbLib.query(params);

    if (!results || results.length === 0) return unsuccessful(404, { message: 'Programa no encontrado.' }, action);

    const document = results[0];
    const { contract } = document.content[0];

    if (!contract) return unsuccessful(404, { message: 'Documento no encontrado.' }, action);

    const { file } = contract;

    if (!file) return unsuccessful(404, { message: 'Archivo no encontrado.' }, action);

    return success(200, file, action);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, action);
  }
};
