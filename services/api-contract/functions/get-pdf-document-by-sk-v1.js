import { getObject } from "../../../libs/s3-v3";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { unsuccessful, binaryFile } from "../../../helpers/responses.js";

const {
  PROGRAM_TABLE,
  DYNAMODB_PROGRAM_TABLE
} = process.env;

export const main = async (event) => {
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

    if (results.length === 0) return unsuccessful(404, { message: 'Programa no encontrado.' }, action);

    const document = results[0];

    const { contract } = document.content[0];

    if (!contract) return unsuccessful(404, { message: 'Documento no encontrado.' }, action);

    const { file } = contract;

    if (!file) return unsuccessful(404, { message: 'Archivo no encontrado.' }, action);

    const s3Params = {
      Bucket: file.bucket,
      Key: `${file.path}/${file.Key}`
    };

    const pdfObject = await getObject(s3Params);

    const streamToBuffer = async (stream) => {
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    };

    const pdfBuffer = await streamToBuffer(pdfObject.Body);
    const base64PDF = pdfBuffer.toString('base64');

    return binaryFile(base64PDF, file.Key);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, action);
  }
};
