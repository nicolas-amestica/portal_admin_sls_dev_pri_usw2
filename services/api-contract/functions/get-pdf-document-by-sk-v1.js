import { getObject } from "../../../libs/s3-v3";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { unsuccessful, success } from "../../../helpers/responses.js";

const {
  PROGRAM_TABLE,
  DYNAMODB_PROGRAM_TABLE
} = process.env;

/**
 * Convierte un stream a Buffer
 * @param {ReadableStream} stream - Stream del objeto S3
 * @returns {Promise<Buffer>} Buffer con el contenido del archivo
 */
const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

export const main = async (event) => {
  const action = "Obtener archivos PDF del documento.";

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

    // Intentar obtener archivos del array files (nuevo formato)
    let files = contract.files;

    // Fallback: si no existe el array files, usar el objeto file singular (formato antiguo)
    if (!files || files.length === 0) {
      if (contract.file) {
        files = [contract.file];
      } else {
        return unsuccessful(404, { message: 'No se encontraron archivos en el contrato.' }, action);
      }
    }

    // Descargar todos los archivos PDF desde S3 y convertirlos a base64
    const pdfDocuments = await Promise.all(
      files.map(async (file) => {
        const s3Params = {
          Bucket: file.bucket,
          Key: `${file.path}/${file.Key}`
        };

        const pdfObject = await getObject(s3Params);
        const pdfBuffer = await streamToBuffer(pdfObject.Body);
        const base64PDF = pdfBuffer.toString('base64');

        return {
          base64: base64PDF,
          fileName: file.Key,
          uploadDate: file.uploadDate,
          type: file.type || 'unknown',
          description: file.description || ''
        };
      })
    );

    return success(200, pdfDocuments, action);
  } catch (e) {
    console.error('Error al obtener archivos PDF:', e);
    return unsuccessful(e.statusCode || 500, e, action);
  }
};
