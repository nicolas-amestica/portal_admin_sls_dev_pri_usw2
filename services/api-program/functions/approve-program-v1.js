import * as S3 from "../../../libs/s3-v3.js";
import { cleanRut } from "../../../utils/rut.js";
import { success } from "../../../helpers/responses.js";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { APPROVED_PROGRAM } from '../helpers/approve-program-email.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { sendEmailWithAttachments, generateEmailHTML } from '../../../libs/nodemailer.js';
import { createPortalUser } from '../../api-entity/helpers/create-user.js';

const {
  STAGE,
  PROGRAM_TABLE,
  BUCKET_INFO_GI,
  DYNAMODB_PROGRAM_TABLE,
  DYNAMODB_USER_TABLE
} = process.env;

const ACTION = "Aprobar programa.";
const MESSAGE = STAGE === 'dev' ? APPROVED_PROGRAM.dev : APPROVED_PROGRAM.prd;

const PENDING_SIGNED_CONTRACT_PREFIX = 'contratos/pending/';
const MAX_SIGNED_PDF_BYTES = 10 * 1024 * 1024;
const AUTO_PROFILE_RULES_PK = 'APP#AUTO_PROFILE_RULES';

/**
 * Regla de perfil automático cacheada en el contexto del Lambda.
 * Se recarga solo si es null (primera invocación del container).
 */
let cachedProgramApprovalRule = undefined;

/** Obtiene la regla PROGRAM_APPROVAL desde DynamoDB (una vez por lifecycle del container). */
const getApprovalProfileRule = async () => {
  if (cachedProgramApprovalRule !== undefined) return cachedProgramApprovalRule;

  const rule = await dynamoDbLib.getOne({
    TableName: DYNAMODB_USER_TABLE,
    Key: { pk: AUTO_PROFILE_RULES_PK, sk: 'RULE#PROGRAM_APPROVAL' },
  });

  cachedProgramApprovalRule = rule?.isActive && rule.profileId
    ? { id: rule.profileId, title: rule.profileTitle || '' }
    : null;

  return cachedProgramApprovalRule;
};

/**
 * Valida que la clave pertenezca al prefijo temporal de contratos firmados subidos por presign PUT.
 */
const isAllowedPendingSignedContractKey = (key) =>
  typeof key === 'string' &&
  key.startsWith(PENDING_SIGNED_CONTRACT_PREFIX) &&
  !key.includes('..') &&
  key.endsWith('.pdf');

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
 * Busca un usuario existente por su email usando el índice GSI.
 */
const getUserByEmail = (email) =>
  dynamoDbLib.query({
    TableName: DYNAMODB_USER_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: '#email = :email',
    ExpressionAttributeValues: { ':email': email },
    ExpressionAttributeNames: { '#email': 'email' }
  });

/**
 * Sube un PDF a S3 y retorna la metadata del archivo subido.
 */
const uploadPdfToS3 = async (pdfBuffer) => {
  const { uuidv7 } = await import('uuidv7');
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

  const signed = formContact.signedContract;
  const s3KeyPending = signed?.s3Key?.trim();
  const base64Payload = signed?.base64?.trim();

  if (!s3KeyPending && !base64Payload) {
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

  let signedContractBuffer;
  if (s3KeyPending) {
    if (!isAllowedPendingSignedContractKey(s3KeyPending)) {
      const error = new Error('Clave del contrato firmado no válida.');
      error.statusCode = 400;
      throw error;
    }
    try {
      signedContractBuffer = await S3.getObjectBuffer({
        Bucket: BUCKET_INFO_GI,
        Key: s3KeyPending,
      });
    } catch (err) {
      const error = new Error('No se pudo leer el contrato firmado desde el almacenamiento.');
      error.statusCode = 400;
      throw error;
    }
    if (signedContractBuffer.length > MAX_SIGNED_PDF_BYTES) {
      const error = new Error('El contrato firmado supera el tamaño máximo permitido (10 MB).');
      error.statusCode = 400;
      throw error;
    }
  } else {
    signedContractBuffer = Buffer.from(base64Payload, 'base64');
    if (signedContractBuffer.length > MAX_SIGNED_PDF_BYTES) {
      const error = new Error('El contrato firmado supera el tamaño máximo permitido (10 MB).');
      error.statusCode = 400;
      throw error;
    }
  }

  const uploadedFile = await uploadPdfToS3(signedContractBuffer);

  if (s3KeyPending) {
    try {
      await S3.deleteObject({ Bucket: BUCKET_INFO_GI, Key: s3KeyPending });
    } catch (err) {
      console.warn(`No se pudo eliminar objeto temporal ${s3KeyPending}:`, err.message);
    }
  }

  program.status = 'approved';
  program.priority = 3;
  program.updatedAt = new Date().toISOString();
  program.content[0].contract.files = program.content[0].contract.files || [];
  program.content[0].contract.files.push(uploadedFile);

  const approvedProgram = await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

  const representative = program.content[0].representative;
  const clientRepsList = program.content[0].contract.clientRepresentative;
  const clientRepresentative =
    clientRepsList?.find((rep) => String(rep?.dni ?? '').trim().length > 0) ?? clientRepsList?.[0];

  if (!clientRepresentative?.dni) {
    const error = new Error('Falta información del representante del cliente.');
    error.statusCode = 400;
    throw error;
  }

  const dniClean = cleanRut(clientRepresentative.dni);
  const clientEmail = representative.email.trim().toLowerCase();
  const existingUsers = await getUserByEmail(clientEmail);

  let temporaryPassword;

  if (existingUsers?.length) {
    const existingUser = existingUsers[0];
    const currentContent = existingUser.content || [];
    const alreadyLinked = currentContent.some(c => c.program === sk);

    if (!alreadyLinked) {
      console.log(`Usuario con email ${clientEmail} ya existe. Agregando programa ${sk} a su content.`);
      const updatedContent = [...currentContent, { createdAt: new Date().toISOString(), program: sk, isActive: true }];
      await dynamoDbLib.update({
        TableName: DYNAMODB_USER_TABLE,
        Key: { pk: existingUser.pk, sk: existingUser.sk },
        UpdateExpression: 'SET content = :content',
        ExpressionAttributeValues: { ':content': updatedContent },
      });
    } else {
      console.log(`Usuario con email ${clientEmail} ya tiene vinculado el programa ${sk}.`);
    }
  } else {
    const approvalRule = await getApprovalProfileRule();
    const profiles = approvalRule ? [approvalRule] : [];

    const { generatedPassword } = await createPortalUser(
      {
        email: clientEmail,
        fullName: clientRepresentative.name || '',
        gsiOne: dniClean,
        phoneNumber: representative.phone || '',
        profiles,
        metadata: { source: 'program-approval', programSk: sk },
      },
      DYNAMODB_USER_TABLE,
    );

    temporaryPassword = generatedPassword;
  }

  const emailSet = new Set();
  formContact?.email?.split(',').map(e => e.trim()).filter(Boolean).forEach(e => emailSet.add(e.toLowerCase()));
  representative?.email?.split(',').map(e => e.trim()).filter(Boolean).forEach(e => emailSet.add(e.toLowerCase()));

  const recipientEmail = [...emailSet].join(', ');
  const recipientName = clientRepresentative?.name || representative?.name || '';
  const passwordForEmail = temporaryPassword || '(contraseña preexistente)';

  const logoBuffer = await loadLogoFromS3();
  const htmlContent = generateEmailHTML({
    recipientName,
    bodyHtml: MESSAGE.buildBody(clientEmail, passwordForEmail),
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
