import { uuidv7 } from "uuidv7";
import middy from "@middy/core";
import * as S3 from "../../../libs/s3-v3";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { resolvePromises } from "../../../helpers/allsettled";
import { success, unsuccessful } from "../../../helpers/responses";
import multipartBodyParser from "@middy/http-multipart-body-parser";

const { BUCKET_INFO_GI, PROGRAM_TABLE_ID, DYNAMODB_PROGRAM_TABLE } = process.env;

/**
 * Sube un archivo a S3 y devuelve metadatos del archivo subido.
 */
const uploadFile = async (content) => {
  const extension = content.filename.split(".").pop().toLowerCase();
  const uuid_v7 = uuidv7();
  const params = {
    Bucket: BUCKET_INFO_GI,
    Key: `balances/${uuid_v7}.${extension}`,
    Body: content.content,
    ContentType: content.contentType || "application/octet-stream",
  };

  await S3.putObject(params);

  return {
    bucket: BUCKET_INFO_GI,
    ext: extension,
    isAttached: true,
    Key: `${uuid_v7}.${extension}`,
    path: "balances",
    uploadDate: new Date().toISOString(),
  };
};

/**
 * Obtiene un programa (balance) desde DynamoDB usando una clave de ordenación.
 */
const getProgramFromDynamodb = async ({ sortKey }) => {
  const params = {
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE_ID, sk: sortKey },
  };
  const balancePromise = dynamoDbLib.getOne(params);
  const [balance] = await resolvePromises([balancePromise]);
  return balance;
};

/**
 * Inserta un nuevo programa de pago en la tabla de DynamoDB configurada (DYNAMODB_PROGRAM_TABLE).
 */
const insertPaymentToProgram = async (newProgram) => {
  const params = {
    TableName: DYNAMODB_PROGRAM_TABLE,
    ReturnConsumedCapacity: "TOTAL",
    Item: newProgram,
  };
  const programPromise = await dynamoDbLib.put(params);
  const [program] = await resolvePromises([programPromise]);
  return program;
};

/**
 * Manejador principal para registrar un ingreso de balance (pago) asociado a un programa.
 */
const baseHandler = async (event) => {
  console.log("event ==>", event);
  const action = "Ingreso de balance al viaje.";
  const { sk, amount, observation, dni, file } = event.body;
  const requiredFields = ["sk", "amount", "dni", "observation"];
  const missing = requiredFields.filter((f) => !event.body[f]);

  if (missing.length) return unsuccessful(400, { message: `Faltan campos requeridos: ${missing.join(", ")}` }, action);
  if (!file || !file.content) {
    const error = new Error('No se encontró archivo adjunto');
    error.statusCode = 400;
    throw error;
  }

  const [program] = await getProgramFromDynamodb({ sortKey: sk });

  if (!program) {
    const error = new Error('Programa no encontrado');
    error.statusCode = 400;
    throw error;
  }

  const fileToUpload = {
    filename: file.filename,
    content: file.content,
    contentType:
      file.contentType || file.mimetype || "application/octet-stream",
  };

  const fileUploaded = await uploadFile(fileToUpload);

  const payment = {
    ...fileUploaded,
    amount,
    observation,
    dni,
  };

  program.content = program.content || [];
  if (program.content.length === 0) program.content.push({});
  program.content[0].payments = program.content[0].payments || [];
  program.content[0].payments.push(payment);

  await insertPaymentToProgram(program);

  return success(200, program, action);
};

/**
 * Handler principal compuesto para la función Lambda "create-balance-v1".
 */
export const main = middy(baseHandler).use(
  multipartBodyParser({
    busboy: {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    },
  })
);
