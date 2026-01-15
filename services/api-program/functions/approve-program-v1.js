import { uuidv7 } from "uuidv7";
import * as S3 from "../../../libs/s3-v3.js";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { buildDocumentData } from '../../../libs/contract/builder.js';
import { success, unsuccessful } from "../../../helpers/responses.js";
import { APPROVED_CONTRACT } from '../../../libs/contract/messages.js';
import { generateContract, loadImages } from '../../../libs/pdf-generator/index.js';
import { sendEmailWithAttachments, generateEmailHTML } from '../../../libs/nodemailer.js';

const {
  STAGE,
  PROGRAM_TABLE,
  BUCKET_INFO_GI,
  DYNAMODB_PROGRAM_TABLE
} = process.env;
const ACTION = "Aprobar programa.";
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
  try {
    const body = parseEventBody(event);
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

    /**
     * Obtener los dnis del contract.representatives.dni (es un array el representatives[]) y 
     * obtener el dni de cada uno he ir a buscar la firma en S3, está en signatures/signature-<DNI>.png (bucket BUCKET_INFO_GI)
     * No sé si hacer una función nueva o utilizar la loadImages y adaptarla para que pueda cargar múltiples imágenes
     * Luego, incrustar cada firma en la sección de firmas del contrato (última hoja) con la función generateContract
     */

    const { headerImage, footerImage } = await loadImages(
      BUCKET_INFO_GI,
      'assets/header.png',
      'assets/footer.png'
    );

    const pdfBuffer = await generateContract(adaptedDocumentData, headerImage, footerImage, { addWatermark: false });

    if (!Buffer.isBuffer(pdfBuffer)) return unsuccessful(500, { message: "El PDF generado no es un buffer válido" }, ACTION);

    const uploadedFile = await uploadFile({
      content: pdfBuffer,
      contentType: 'application/pdf'
    });

    program.status = 'approved';
    program.updatedAt = new Date().toISOString();
    program.content[0].contract.file = uploadedFile;
    const approvedProgram = await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

    /**
     * Crear cuenta de usuario con permiso de usuario (perfil ACC#CLI#Cliente), el objeto a crear en DynamoDB es:
     * {
     *   "pk": "USR#4f7cb502-4256-11ec-81d3-0242ac130003",
     *   "sk": "USR#19", <- contract.clientRepresentative.dni (USR#<RUT CON DV SIN PUNTOS NI GUION>)
     *   "createdAt": "2025-11-08T02:14:10.472Z", <- nueva fecha
     *   "email": "niamesvi3@gmail.com", <- program.representative.email
     *   "gsiOne": "19", <- contract.clientRepresentative.dni (<RUT CON DV SIN PUNTOS NI GUION>)
     *   "id": "4127943b-5c13-48f2-b3f7-aefc0115b582", <- nuevo uuidv7
     *   "isActive": true, <- por defecto true
     *   "lastAccess": "2025-12-26T17:52:56.452Z", <- nueva fecha
     *   "names": "Nicolás", <- contract.clientRepresentative.name
     *   "password": "$2a$10$LmF0FpKID889ozgC1M.PEe4Bi9sPMrgg0aPsC6eUmyxJnuvXAWeV2", <- password hasheada (por defecto "Indomito1234$")
     *   "phoneNumber": "+56959139687",  <- program.representative.phone
     *   "profiles": [ "ACC#CLI#Cliente" ], <- por defecto
     *   "rut": "1-9", <- contract.clientRepresentative.rut (SIN PUNTOS Y CON GUION)
     *   "surnames": "Améstica Vidal" <- contract.clientRepresentative.name
     *   }
     * Luego enviar email al usuario con el contrato adjunto y el usuario y contraseña provisoria (Indomito1234$), modifica body para enviarlo a generateEmailHTML.
     */

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