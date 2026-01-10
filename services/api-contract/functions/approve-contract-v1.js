import { uuidv7 } from "uuidv7";
import * as S3 from "../../../libs/s3-v3";
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { APPROVED_CONTRACT } from '../constants/messages.js';
import { buildDocumentData } from '../core/contract/builder.js';
import { success, unsuccessful } from "../../../helpers/responses";
import { generatePDF, loadImages } from '../../../libs/pdf-generator/index.js';
import { sendEmailWithAttachments, generateEmailHTML } from '../../../libs/nodemailer.js';

const {
  STAGE,
  PROGRAM_TABLE,
  BUCKET_INFO_GI,
  DYNAMODB_PROGRAM_TABLE
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
    let body;
    if (typeof event.body === 'string') {
      if (event.isBase64Encoded) {
        const decodedBody = Buffer.from(event.body, 'base64').toString('utf-8');
        body = JSON.parse(decodedBody);
      } else {
        body = JSON.parse(event.body);
      }
    } else {
      body = event.body;
    }

    const { sk, formContact } = body;

    if (!sk) return unsuccessful(400, { message: "Falta el identificador del programa en la solicitud." }, ACTION);

    if (!formContact) return unsuccessful(400, { message: "Falta el formulario en la solicitud." }, ACTION);

    const programs = await dynamoDbLib.query({
      TableName: DYNAMODB_PROGRAM_TABLE,
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
      ExpressionAttributeValues: { ':pk': PROGRAM_TABLE, ':sk': sk },
      ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' }
    });

    if (!programs || programs.length === 0) return unsuccessful(404, { message: "Programa no encontrado." }, ACTION);

    let program = programs[0];

    const adaptedDocumentData = buildDocumentData(program.content[0].contract);

    const { headerImage, footerImage } = await loadImages(
      BUCKET_INFO_GI,
      'assets/header.png',
      'assets/footer.png'
    );

    const pdfBuffer = await generatePDF(adaptedDocumentData, headerImage, footerImage, { addWatermark: false });

    if (!Buffer.isBuffer(pdfBuffer)) return unsuccessful(500, { message: "El PDF generado no es un buffer válido" }, ACTION);

    const uploadedFile = await uploadFile({
      content: pdfBuffer,
      contentType: 'application/pdf'
    });

    program.status = 'approved';
    program.updatedAt = new Date().toISOString();
    program.content[0].contract.file = uploadedFile;
    const approvedProgram = await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

    const recipientEmail = formContact.email;
    const recipientName = formContact.name || formContact.email;

    if (recipientEmail) {
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
    } else {
      return unsuccessful(500, { message: "Falta el correo electrónico del destinatario." }, ACTION);
    }

    return success(200, approvedProgram, ACTION);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, ACTION);
  }
};