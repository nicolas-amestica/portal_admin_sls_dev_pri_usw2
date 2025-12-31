import { uuidv7 } from "uuidv7";
import * as S3 from "../../../libs/s3-v3";
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { buildDocumentData } from '../core/contract/builder.js';
import { success, unsuccessful } from "../../../helpers/responses";
import { generatePDF, loadImages } from '../../../libs/pdf-generator/index.js';
import { sendEmailWithAttachments, generateEmailHTML } from '../../../libs/nodemailer.js';
import { APPROVED_CONTRACT } from '../constants/messages.js';

const {
  DYNAMODB_PROGRAM_TABLE,
  PROGRAM_TABLE,
  BUCKET_INFO_GI,
  STAGE
} = process.env;
const ACTION = "Aprueba el contrato generado, genera pdf y lo almacena en S3.";
const MESSAGE = STAGE === 'dev' ? APPROVED_CONTRACT.dev : APPROVED_CONTRACT.prd;

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
  console.log("Event ==>", JSON.stringify(event, null, 2));

  try {
    // 1. Validar parámetros
    console.log("Paso 1: Validando parámetros...");
    console.log("event.body tipo:", typeof event.body);
    console.log("event.isBase64Encoded:", event.isBase64Encoded);

    // Manejar body que puede venir en diferentes formatos
    let body;
    if (typeof event.body === 'string') {
      // Si está en base64, decodificarlo primero
      if (event.isBase64Encoded) {
        const decodedBody = Buffer.from(event.body, 'base64').toString('utf-8');
        console.log("Body decodificado de base64");
        body = JSON.parse(decodedBody);
      } else {
        body = JSON.parse(event.body);
      }
    } else {
      body = event.body;
    }

    const { sk, formContact } = body;

    if (!sk) {
      console.error("Error: Falta el identificador del programa");
      return unsuccessful(400, { message: "Falta el identificador del programa en la solicitud." }, ACTION);
    }

    if (!formContact) {
      console.error("Error: Falta el formulario de contacto");
      return unsuccessful(400, { message: "Falta el formulario en la solicitud." }, ACTION);
    }

    // 2. Buscar programa en DynamoDB
    console.log(`Paso 2: Buscando programa con sk: ${sk}...`);
    const programs = await dynamoDbLib.query({
      TableName: DYNAMODB_PROGRAM_TABLE,
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
      ExpressionAttributeValues: { ':pk': PROGRAM_TABLE, ':sk': sk },
      ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' }
    });

    if (!programs || programs.length === 0) {
      console.error("Error: Programa no encontrado");
      return unsuccessful(404, { message: "Programa no encontrado." }, ACTION);
    }

    let program = programs[0];
    console.log("Programa encontrado:", program.sk);

    // 3. Construir datos del documento dinámicamente
    console.log("Paso 3: Construyendo datos del documento...");
    const adaptedDocumentData = buildDocumentData(program.content[0].contract);

    // 4. Cargar imágenes desde S3
    console.log(`Paso 4: Cargando imágenes desde S3 (bucket: ${BUCKET_INFO_GI})...`);
    const { headerImage, footerImage } = await loadImages(
      BUCKET_INFO_GI,
      'assets/header.png',
      'assets/footer.png'
    );

    // 5. Generar PDF sin marca de agua
    console.log("Paso 5: Generando PDF final sin marca de agua...");
    const pdfBuffer = await generatePDF(adaptedDocumentData, headerImage, footerImage, { addWatermark: false });

    if (!Buffer.isBuffer(pdfBuffer)) {
      console.error("Error: El PDF generado no es un buffer válido");
      return unsuccessful(500, { message: "El PDF generado no es un buffer válido" }, ACTION);
    }

    console.log(`PDF generado exitosamente. Tamaño: ${pdfBuffer.length} bytes`);

    // 6. Almacenar PDF en S3
    console.log("Paso 6: Almacenando PDF en S3...");
    const uploadedFile = await uploadFile({
      content: pdfBuffer,
      contentType: 'application/pdf'
    });
    console.log(`PDF almacenado en S3: ${uploadedFile.path}/${uploadedFile.Key}`);

    // 7. Guardar referencia del archivo y actualizar estado del programa
    console.log("Paso 7: Actualizando estado del programa en DynamoDB...");
    program.status = 'approved';
    program.updatedAt = new Date().toISOString();
    program.content[0].contract.file = uploadedFile;
    const approvedProgram = await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

    // 8. Enviar email con documento adjunto
    const recipientEmail = formContact.email;
    const recipientName = formContact.name || formContact.email;

    if (recipientEmail) {
      console.log(`Paso 8: Enviando email a ${recipientEmail}...`);
      const htmlContent = generateEmailHTML({
        title: MESSAGE.title,
        recipientName: recipientName,
        body: MESSAGE.body
      });

      await sendEmailWithAttachments({
        to: recipientEmail,
        subject: MESSAGE.subject,
        html: htmlContent,
        attachments: [{
          filename: `contrato-${uploadedFile.Key}`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      });
      console.log("Email enviado exitosamente");
    } else {
      console.log("Paso 8: No se envió email (falta recipientEmail)");
    }

    console.log("Proceso completado exitosamente");
    return success(200, approvedProgram, ACTION);
  } catch (e) {
    console.error("Error en aprobación de contrato:", {
      message: e.message,
      stack: e.stack,
      statusCode: e.statusCode,
      name: e.name
    });

    return unsuccessful(
      e.statusCode || 500,
      {
        message: e.message || 'Error desconocido al aprobar contrato',
        error: e.name,
        details: STAGE === 'dev' ? e.stack : undefined
      },
      ACTION
    );
  }
};