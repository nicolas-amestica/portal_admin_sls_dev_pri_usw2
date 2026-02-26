import bcrypt from "bcryptjs";
import { uuidv7 } from "uuidv7";
import * as S3 from "../../../libs/s3-v3.js";
import { cleanRut } from "../../../utils/rut.js";
import { success } from "../../../helpers/responses.js";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { APPROVED_PROGRAM } from '../../../libs/contract/messages.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { sendEmailWithAttachments, generateEmailHTML } from '../../../libs/nodemailer.js';

const {
  STAGE,
  PROGRAM_TABLE,
  BUCKET_INFO_GI,
  DYNAMODB_PROGRAM_TABLE,
  DYNAMODB_USER_TABLE
} = process.env;

const ACTION = "Aprobar programa.";
const MESSAGE = STAGE === 'dev' ? APPROVED_PROGRAM.dev : APPROVED_PROGRAM.prd;

/**
 * Obtiene un programa desde DynamoDB usando una clave de ordenación como prefijo.
 */
const getProgramBySk = (sk) =>
  dynamoDbLib.query({
    TableName: DYNAMODB_PROGRAM_TABLE,
    KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
    ExpressionAttributeValues: { ':pk': PROGRAM_TABLE, ':sk': sk },
    ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' }
  });

/**
 * Busca un usuario existente por su DNI usando el índice GSI.
 */
const getUserByDni = (dniClean) =>
  dynamoDbLib.query({
    TableName: DYNAMODB_USER_TABLE,
    IndexName: 'gsiOne-index',
    KeyConditionExpression: '#gsiOne = :gsiOne',
    ExpressionAttributeValues: { ':gsiOne': dniClean },
    ExpressionAttributeNames: { '#gsiOne': 'gsiOne' }
  });

/**
 * Sube un PDF a S3 y retorna la metadata del archivo subido.
 */
const uploadPdfToS3 = async (pdfBuffer) => {
  const uuid_v7 = uuidv7();
  await S3.putObject({
    Bucket: BUCKET_INFO_GI,
    Key: `contratos/${uuid_v7}.pdf`,
    Body: pdfBuffer,
    ContentType: "application/pdf",
  });
  return {
    bucket: BUCKET_INFO_GI,
    ext: 'pdf',
    isAttached: true,
    Key: `${uuid_v7}.pdf`,
    path: "contratos",
    uploadDate: new Date().toISOString()
  };
};

/**
 * Construye el objeto de nuevo usuario a partir del representante del contrato.
 */
const buildUser = async ({ dniClean, clientRepresentative, representative, sk }) => {
  const rutFormatted = clientRepresentative.dni.replace(/\./g, '');
  const fullName = clientRepresentative.name || '';
  const nameParts = fullName.trim().split(' ');
  const names = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ');
  const surnames = nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ');
  const hashedPassword = await bcrypt.hash('Indomito1234$', 10);
  const currentDate = new Date().toISOString();
  const userId = uuidv7();

  return {
    pk: `USR#${userId}`,
    sk: `USR#${dniClean}`,
    id: userId,
    gsiOne: dniClean,
    email: representative.email,
    names: names || clientRepresentative.name,
    surnames: surnames || '',
    rut: rutFormatted,
    phoneNumber: representative.phone || '',
    password: hashedPassword,
    profiles: ['ACC#CLI#Cliente'],
    isActive: true,
    createdAt: currentDate,
    lastAccess: currentDate,
    content: [{ createdAt: currentDate, program: sk, isActive: true }]
  };
};

/**
 * Intenta cargar el logo desde S3. Retorna null si no está disponible.
 */
const loadLogoFromS3 = async () => {
  try {
    const logoObject = await S3.getObject({ Bucket: BUCKET_INFO_GI, Key: 'assets/logo-gi.png' });
    return Buffer.from(await logoObject.Body.transformToByteArray());
  } catch (err) {
    console.warn('No se pudo cargar el logo desde S3, se enviará sin logo:', err.message);
    return null;
  }
};

/**
 * Construye la lista de attachments para el email con el logo (si existe) y el contrato firmado.
 */
const buildEmailAttachments = (logoBuffer, signedContractBuffer, contractKey) => {
  const attachments = [];

  if (logoBuffer) {
    attachments.push({
      filename: 'logo.png',
      content: logoBuffer,
      contentType: 'image/png',
      cid: 'logo-giras-indomito',
      contentDisposition: 'inline'
    });
  }

  attachments.push({
    filename: `contrato-firmado-${contractKey}`,
    content: signedContractBuffer,
    contentType: 'application/pdf'
  });

  return attachments;
};

/**
 * Handler principal para aprobar un programa: sube contrato, crea usuario y envía email de bienvenida.
 */
const handler = async (event) => {
  const { sk, formContact } = event.body;

  if (!sk) {
    const error = new Error('Falta el identificador del programa en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  if (!formContact) {
    const error = new Error('Falta el formulario en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  if (!formContact.signedContract?.base64) {
    const error = new Error('Falta el contrato firmado en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  const programs = await getProgramBySk(sk);

  if (!programs?.length) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const program = programs[0];
  const signedContractBuffer = Buffer.from(formContact.signedContract.base64, 'base64');
  const uploadedFile = await uploadPdfToS3(signedContractBuffer);

  program.status = 'approved';
  program.priority = 3;
  program.updatedAt = new Date().toISOString();
  program.content[0].contract.files = program.content[0].contract.files || [];
  program.content[0].contract.files.push(uploadedFile);

  const approvedProgram = await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

  const clientRepresentative = program.content[0].contract.clientRepresentative;
  const representative = program.content[0].representative;

  if (!clientRepresentative?.dni) {
    const error = new Error('Falta información del representante del cliente.');
    error.statusCode = 400;
    throw error;
  }

  const dniClean = cleanRut(clientRepresentative.dni);
  const existingUsers = await getUserByDni(dniClean);

  if (existingUsers?.length) {
    console.log(`Usuario con DNI ${dniClean} ya existe, no se creará uno nuevo.`);
  } else {
    const newUser = await buildUser({ dniClean, clientRepresentative, representative, sk });
    await dynamoDbLib.put({ TableName: DYNAMODB_USER_TABLE, Item: newUser });
  }

  const emailSet = new Set();
  formContact?.email?.split(',').map(e => e.trim()).filter(Boolean).forEach(e => emailSet.add(e.toLowerCase()));
  representative?.email?.split(',').map(e => e.trim()).filter(Boolean).forEach(e => emailSet.add(e.toLowerCase()));

  const recipientEmail = [...emailSet].join(', ');
  const recipientName = clientRepresentative?.name || representative?.name || '';
  const temporaryPassword = 'Indomito1234$';

  const logoBuffer = await loadLogoFromS3();
  const htmlContent = generateEmailHTML({
    title: MESSAGE.title,
    recipientName,
    bodyHtml: MESSAGE.buildBody(dniClean, temporaryPassword),
    useCidLogo: !!logoBuffer
  });

  await sendEmailWithAttachments({
    to: recipientEmail,
    subject: MESSAGE.subject,
    html: htmlContent,
    attachments: buildEmailAttachments(logoBuffer, signedContractBuffer, uploadedFile.Key)
  });

  return success(200, approvedProgram, ACTION);
};

export const main = standardMiddleware(handler);
