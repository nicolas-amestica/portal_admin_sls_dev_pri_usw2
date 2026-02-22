import bcrypt from "bcryptjs";
import { uuidv7 } from "uuidv7";
import * as S3 from "../../../libs/s3-v3.js";
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
 * Sube un archivo PDF a S3 y retorna la metadata del archivo.
 */
const uploadPdfToS3 = async (pdfBuffer) => {
  const extension = 'pdf';
  const uuid_v7 = uuidv7();
  const params = {
    Bucket: BUCKET_INFO_GI,
    Key: `contratos/${uuid_v7}.${extension}`,
    Body: pdfBuffer,
    ContentType: "application/pdf",
  };

  await S3.putObject(params);

  return {
    bucket: BUCKET_INFO_GI,
    ext: extension,
    isAttached: true,
    Key: `${uuid_v7}.${extension}`,
    path: "contratos",
    uploadDate: new Date().toISOString()
  };
};

const handler = async (event) => {
  const { sk, formContact } = event.body;

  // Validar parámetros requeridos
  if (!sk) {
    const error = new Error('Falta el identificador del programa en la solicitud.')
    error.statusCode = 400;
    throw error;
  }

  if (!formContact) {
    const error = new Error('Falta el formulario en la solicitud.')
    error.statusCode = 400;
    throw error;
  }

  if (!formContact.signedContract || !formContact.signedContract.base64) {
    const error = new Error('Falta el contrato firmado en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  // Buscar el programa en DynamoDB
  const programs = await dynamoDbLib.query({
    TableName: DYNAMODB_PROGRAM_TABLE,
    KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
    ExpressionAttributeValues: { ':pk': PROGRAM_TABLE, ':sk': sk },
    ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' }
  });

  if (!programs || programs.length === 0) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const program = programs[0];

  // Convertir base64 a Buffer
  const signedContractBuffer = Buffer.from(formContact.signedContract.base64, 'base64');

  // Subir el contrato firmado a S3
  const uploadedFile = await uploadPdfToS3(signedContractBuffer);

  // Actualizar el programa con el estado y el archivo
  program.status = 'approved';
  program.updatedAt = new Date().toISOString();

  // Inicializar el array de archivos si no existe
  if (!program.content[0].contract.files) {
    program.content[0].contract.files = [];
  }

  // Agregar el contrato firmado al array de archivos
  program.content[0].contract.files.push(uploadedFile);

  // Guardar el programa actualizado
  const approvedProgram = await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

  // Crear cuenta de usuario
  const clientRepresentative = program.content[0].contract.clientRepresentative;
  const representative = program.content[0].representative;

  if (!clientRepresentative || !clientRepresentative.dni) {
    const error = new Error('Falta información del representante del cliente.');
    error.statusCode = 400;
    throw error;
  }

  // Formatear DNI para username (sin puntos ni guión)
  const dniClean = clientRepresentative.dni.replace(/\./g, '').replace(/-/g, '');
  const username = dniClean;

  // Formatear RUT para el campo rut (sin puntos, con guión)
  const rutFormatted = clientRepresentative.dni.replace(/\./g, '');

  // Separar nombres y apellidos
  const fullName = clientRepresentative.name || '';
  const nameParts = fullName.trim().split(' ');
  const names = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ');
  const surnames = nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ');

  // Contraseña temporal
  const temporaryPassword = 'Indomito1234$';
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const currentDate = new Date().toISOString();
  const userId = uuidv7();

  // Crear objeto de usuario
  const newUser = {
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
    content: [{
      createdAt: currentDate,
      program: sk,
      isActive: true
    }]
  };

  // Verificar si el usuario ya existe
  const existingUserParams = {
    TableName: DYNAMODB_USER_TABLE,
    IndexName: 'gsiOne-index',
    KeyConditionExpression: '#gsiOne = :gsiOne',
    ExpressionAttributeValues: { ':gsiOne': dniClean },
    ExpressionAttributeNames: { '#gsiOne': 'gsiOne' }
  };

  const existingUsers = await dynamoDbLib.query(existingUserParams);

  if (existingUsers && existingUsers.length > 0)
    console.log(`Usuario con DNI ${dniClean} ya existe, no se creará uno nuevo.`);
  else
    await dynamoDbLib.put({ TableName: DYNAMODB_USER_TABLE, Item: newUser });

  const emailSet = new Set();
  if (formContact?.email) {
    formContact.email.split(',').map(e => e.trim()).filter(Boolean).forEach(e => emailSet.add(e.toLowerCase()));
  }
  if (representative?.email) {
    representative.email.split(',').map(e => e.trim()).filter(Boolean).forEach(e => emailSet.add(e.toLowerCase()));
  }
  const recipientEmail = [...emailSet].join(', ');
  const recipientName = clientRepresentative?.name || representative?.name || '';

  // Cargar logo desde S3 para incrustar en el email (opcional)
  let logoBuffer = null;
  let useCidLogo = false;

  try {
    const logoParams = {
      Bucket: BUCKET_INFO_GI,
      Key: 'assets/logo-gi.png'
    };
    const logoObject = await S3.getObject(logoParams);
    logoBuffer = Buffer.from(await logoObject.Body.transformToByteArray());
    useCidLogo = true;
  } catch (logoError) {
    console.warn('No se pudo cargar el logo desde S3, se enviará sin logo:', logoError.message);
  }

  // Construir el body HTML con las credenciales
  const bodyHtml = MESSAGE.buildBody(username, temporaryPassword);

  // Generar el HTML completo del email
  const htmlContent = generateEmailHTML({
    title: MESSAGE.title,
    recipientName: recipientName,
    bodyHtml: bodyHtml,
    useCidLogo: useCidLogo
  });

  // Construir attachments
  const attachments = [];

  // Agregar logo si está disponible
  if (logoBuffer) {
    attachments.push({
      filename: 'logo.png',
      content: logoBuffer,
      contentType: 'image/png',
      cid: 'logo-giras-indomito',
      contentDisposition: 'inline'
    });
  }

  // Agregar contrato PDF firmado
  attachments.push({
    filename: `contrato-firmado-${uploadedFile.Key}`,
    content: signedContractBuffer,
    contentType: 'application/pdf'
  });

  await sendEmailWithAttachments({
    to: recipientEmail,
    subject: MESSAGE.subject,
    html: htmlContent,
    attachments: attachments
  });

  return success(200, approvedProgram, ACTION);
};

export const main = standardMiddleware(handler);
