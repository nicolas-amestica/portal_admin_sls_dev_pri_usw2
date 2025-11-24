import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";
import { loadImages } from '../core/assets/image-loader.js';
import { CONTRACT_TEMPLATE } from '../core/contract/template.js';
import { buildContractData } from '../core/contract/builder.js';
import { generatePDF } from '../core/pdf/generator.js';

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE, BUCKET_INFO_GI } = process.env;

/**
 * Handler principal para generar contratos en PDF
 *
 * @param {Object} event - Evento de API Gateway
 * @returns {Object} Respuesta con PDF en base64
 */
export const main = async (event) => {
  console.log("Event ==>", event);
  const action = "Generar contrato del programa.";
  try {
    // 1. Validar parámetros
    const { id, type } = event.queryStringParameters;

    if (!id) return unsuccessful(400, { message: 'Falta el identificador del programa.' }, action);
    if (!type) return unsuccessful(400, { message: 'Falta el tipo de respuesta del contrato.' }, action);

    // 2. Consultar programa en DynamoDB
    const [program] = await dynamoDbLib.query({
      TableName: DYNAMODB_PROGRAM_TABLE,
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
      ExpressionAttributeValues: {
        ':pk': PROGRAM_TABLE,
        ':sk': id
      },
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sk': 'sk'
      }
    });

    if (!program)
      return unsuccessful(404, { message: 'Programa no encontrado.' }, action);

    // 3. Construir datos del contrato
    const contractData = buildContractData(CONTRACT_TEMPLATE, program);

    // 4. Cargar imágenes desde S3
    const { headerImage, footerImage } = await loadImages(
      BUCKET_INFO_GI,
      'assets/header.png',
      'assets/footer.png'
    );

    // 5. Generar PDF
    const pdfBuffer = await generatePDF(contractData, headerImage, footerImage);

    if (!Buffer.isBuffer(pdfBuffer))
      return unsuccessful(500, { message: "El PDF generado no es un Buffer válido" }, action);

    // 6. Retornar respuesta

    if (type === 'base64') {
      return success(200, pdfBuffer.toString('base64'), action);
    } else if (type === 'buffer') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename=contrato-servicios-turisticos.pdf',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: pdfBuffer.toString('base64'),
        isBase64Encoded: true
      };
    } else {
      return unsuccessful(400, { message: 'Tipo de respuesta no soportado.' }, action);
    }
  } catch (error) {
    return unsuccessful(500, {
      message: 'Error al generar el contrato',
      error: error.message
    }, action);
  }
};
