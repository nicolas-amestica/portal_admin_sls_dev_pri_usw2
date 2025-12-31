import { uuidv7 } from "uuidv7";
import * as S3 from "../../../libs/s3-v3";
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { buildDocumentData } from '../core/contract/builder.js';
import { success, unsuccessful } from "../../../helpers/responses";
import { generatePDF, loadImages } from '../../../libs/pdf-generator/index.js';

const {
  DYNAMODB_PROGRAM_TABLE,
  PROGRAM_TABLE,
  BUCKET_INFO_GI
} = process.env;
const ACTION = "Aprueba el contrato generado, genera pdf y lo almacena en S3.";

const uploadFile = async (content) => {
  const extension = 'pdf';
  const uuid_v7 = uuidv7();
  const params = {
    Bucket: BUCKET_INFO_GI,
    Key: `contratos/${uuid_v7}.${extension}`,
    Body: content.content,
    ContentType: content.contentType || "application/octet-stream",
  };

  await S3.putObject(params);

  return {
    bucket: BUCKET_INFO_GI,
    ext: extension,
    isAttached: true,
    Key: `${uuid_v7}.${extension}`,
    path: "contratos",
    uploadDate: new Date().toISOString(),
  };
};

export const main = async (event) => {
  // console.log("Event ==> ", event);
  try {
    const { sk } = event.queryStringParameters;

    if (!sk) return unsuccessful(400, { message: "Falta el identificador del programa en la solicitud." }, ACTION);

    const programs = await dynamoDbLib.query({
      TableName: DYNAMODB_PROGRAM_TABLE,
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
      ExpressionAttributeValues: { ':pk': PROGRAM_TABLE, ':sk': sk },
      ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' }
    });

    if (!programs || programs.length === 0) return unsuccessful(404, { message: "Programa no encontrado." }, ACTION);

    let program = programs[0];

    // 2. Construir datos del documento dinámicamente
    const adaptedDocumentData = buildDocumentData(program.content[0].contract);

    // 3. Cargar imágenes desde S3
    const { headerImage, footerImage } = await loadImages(
      BUCKET_INFO_GI,
      'assets/header.png',
      'assets/footer.png'
    );

    // 4. Generar PDF
    const pdfBuffer = await generatePDF(adaptedDocumentData, headerImage, footerImage);
    if (!Buffer.isBuffer(pdfBuffer)) return unsuccessful(500, { message: "El PDF generado no es un buffer válido" }, ACTION);

    // 5. Almacenar PDF en S3
    const uploadedFile = await uploadFile({
      content: pdfBuffer.toString('base64'),
      contentType: 'application/pdf'
    });

    // 6. Guardar referencia del archivo y actualizar estado del programa
    program.status = 'approved';
    program.updatedAt = new Date().toISOString();
    program.content[0].contract.file = uploadedFile;
    const approvedProgram = await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

    // 6. Enviar email con documento adjunto

    return success(200, approvedProgram, ACTION);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, ACTION);
  }
};