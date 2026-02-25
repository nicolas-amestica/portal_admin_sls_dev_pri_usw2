import { uuidv7 } from "uuidv7";
import middy from "@middy/core";
import * as S3 from "../../../libs/s3-v3";
import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import multipartBodyParser from "@middy/http-multipart-body-parser";
import { errorHandlerMiddleware } from "../../../libs/middleware/error-handler.js";

const { BUCKET_INFO_GI, PROGRAM_TABLE_ID, DYNAMODB_PROGRAM_TABLE } = process.env;

const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];

/**
 * Sube un archivo a S3 y devuelve metadatos del archivo subido.
 * Valida que la extensión sea de un tipo permitido antes de subir.
 */
const uploadFile = async ({ filename, content, contentType }) => {
  const extension = filename.split(".").pop().toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    const error = new Error(`Tipo de archivo no permitido. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  const uuid_v7 = uuidv7();
  await S3.putObject({
    Bucket: BUCKET_INFO_GI,
    Key: `balances/${uuid_v7}.${extension}`,
    Body: content,
    ContentType: contentType || "application/octet-stream",
  });

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
 * Obtiene un programa desde DynamoDB usando una clave de ordenación.
 */
const getProgramFromDynamodb = (sortKey) =>
  dynamoDbLib.getOne({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE_ID, sk: sortKey },
  });

/**
 * Manejador principal para registrar un ingreso de balance (pago) asociado a un programa.
 */
const baseHandler = async (event) => {
  const action = "Ingreso de balance al viaje.";
  const { sk, amount, observation, dni, file } = event.body;

  const requiredFields = ["sk", "amount", "observation"];
  const missing = requiredFields.filter((f) => !event.body[f]);
  if (missing.length) {
    const error = new Error(`Faltan campos requeridos: ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  if (!file?.content) {
    const error = new Error("No se encontró archivo adjunto");
    error.statusCode = 400;
    throw error;
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    const error = new Error("El monto debe ser un número positivo");
    error.statusCode = 400;
    throw error;
  }

  const program = await getProgramFromDynamodb(sk);
  if (!program) {
    const error = new Error("Programa no encontrado");
    error.statusCode = 404;
    throw error;
  }

  const fileUploaded = await uploadFile({
    filename: file.filename,
    content: file.content,
    contentType: file.contentType || file.mimetype,
  });

  const payment = {
    ...fileUploaded,
    amount: parsedAmount,
    observation,
    ...(dni && { dni })
  };

  program.content = program.content?.length ? program.content : [{ payments: [] }];
  program.content[0].payments = program.content[0].payments || [];
  program.content[0].payments.push(payment);

  await dynamoDbLib.put({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Item: program,
  });

  return success(200, program, action);
};

/**
 * Handler principal compuesto para la función Lambda "create-balance-v1".
 */
export const main = middy(baseHandler)
  .use(
    multipartBodyParser({
      busboy: {
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB
        },
      },
    })
  )
  .use(errorHandlerMiddleware());
