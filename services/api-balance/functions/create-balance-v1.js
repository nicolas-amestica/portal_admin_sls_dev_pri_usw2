import { uuidv7 } from "uuidv7";
import * as S3 from "../../../libs/s3-v3";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { resolvePromises } from "../../../helpers/allsettled";
import { success, unsuccessful } from "../../../helpers/responses";

const parser = require("lambda-multipart-data-parser");

const {
  BUCKET_INFO_GI,
  PROGRAM_TABLE_ID,
  DYNAMODB_PROGRAM_TABLE
} = process.env;

/**
 * Sube un archivo a S3 y devuelve metadatos de la carga.
 *
 * El nombre del archivo en S3 se genera con uuidv7 y mantiene la extensión
 * extraída del campo `file.filename` (última parte después de un punto, en minúsculas).
 * El objeto se sube al bucket configurado en `BUCKET_INFO_GI` bajo la ruta `balances/`.
 *
 * @async
 * @param {Object} file - Objeto que representa el archivo a subir.
 * @param {string} file.filename - Nombre original del archivo (incluye extensión).
 * @param {Buffer|Uint8Array|String|import('stream').Readable} file.content - Contenido del archivo (valor para Body de S3).
 * @param {string} [file.contentType] - Tipo MIME del archivo (ContentType para S3).
 * @param {string} [file.encoding] - Codificación del contenido (ContentEncoding para S3).
 * @returns {Promise<{
 *   bucket: string,
 *   ext: string,
 *   isAttached: boolean,
 *   Key: string,
 *   path: string,
 *   uploadDate: string
 * }>} Resuelve con un objeto que contiene metadatos de la subida:
 *   - bucket: nombre del bucket usado (BUCKET_INFO_GI).
 *   - ext: extensión del archivo (en minúsculas).
 *   - isAttached: siempre true si la subida fue exitosa.
 *   - Key: nombre de archivo generado (UUID + extensión).
 *   - path: ruta dentro del bucket ("balances").
 *   - uploadDate: fecha de subida en formato ISO.
 *
 * @throws {Error} Propaga errores de la operación de subida a S3 o de la generación del nombre.
 */
const uploadFile = async (file) => {
  const extension = file.filename.split(".").pop().toLowerCase();
  const uuid_v7 = uuidv7();
  const params = {
    Bucket: BUCKET_INFO_GI,
    Key: `balances/${uuid_v7}.${extension}`,
    Body: file.content,
    ContentType: file.contentType,
    ContentEncoding: file.encoding,
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
 * Recupera un registro de programa desde la tabla de DynamoDB usando una clave de ordenación.
 *
 * Esta función construye los parámetros necesarios para consultar la tabla DYNAMODB_PROGRAM_TABLE
 * con la clave primaria fija PROGRAM_TABLE_ID y la clave de ordenación proporcionada, delegando
 * la obtención al helper dynamoDbLib.getOne y normalizando la respuesta mediante resolvePromises.
 *
 * @async
 * @param {Object} options - Opciones de consulta.
 * @param {string} options.sortKey - Clave de ordenación (sk) utilizada para identificar el registro.
 * @returns {Promise<Object|null>} Una promesa que se resuelve con el objeto de balance/programa si existe,
 *                                 o null/undefined si no se encuentra ningún ítem.
 * @throws {Error} Si la operación de lectura en DynamoDB falla, la promesa se rechazará con el error correspondiente.
 *
 * @example
 * // Obtener programa por su sortKey
 * const program = await getProgramFromDynamodb({ sortKey: 'PROGRAM#123' });
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
 * Inserta un pago/registro en la tabla de programas de DynamoDB.
 *
 * @async
 * @function insertPaymentToProgram
 * @param {Object} newProgram - Objeto que representa el nuevo elemento a insertar en la tabla (debe cumplir el esquema y las claves esperadas).
 * @returns {Promise<Object>} Promesa que resuelve con el resultado de la operación de escritura en DynamoDB (incluye información como capacidad consumida y metadatos devueltos por la librería).
 * @throws {Error} Propaga cualquier error producido por dynamoDbLib.put o por resolvePromises si la inserción falla.
 * @remarks
 * - La operación usa la tabla indicada por la constante DYNAMODB_PROGRAM_TABLE.
 * - Se solicita ReturnConsumedCapacity: "TOTAL" para obtener información de consumo de capacidad.
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
 * Maneja la creación de un registro de pago (balance) asociado a un viaje/programa.
 *
 * El handler:
 *  - Parseará el evento multipart para extraer campos y archivos (usa `parser.parse`).
 *  - Valida que existan los campos requeridos: `sk`, `amount`, `files`, `paymentObservation`.
 *  - Sube el primer archivo recibido (si existe) mediante `uploadFile`.
 *  - Recupera el programa asociado a `sk` desde DynamoDB (`getProgramFromDynamodb`).
 *  - Añade un objeto `payment` (con los datos del archivo subido, `amount` y `paymentObservation`)
 *    a `program.content[0].payments` (creando la estructura necesaria si hace falta).
 *  - Persiste la modificación del programa con `insertPaymentToProgram`.
 *  - Devuelve una respuesta de éxito o una respuesta de error con código HTTP apropiado.
 *
 * Notas sobre manejo de errores:
 *  - Si faltan campos requeridos, responde con un error 400 indicando los campos faltantes.
 *  - Cualquier excepción interna devuelve el `statusCode` de la excepción si está presente,
 *    o 500 por defecto.
 *
 * @async
 * @function main
 * @param {Object} event - Evento entrante (request) que contiene el payload multipart.
 *                         Se espera que sea compatible con `parser.parse`.
 * @returns {Promise<Object>} Respuesta estandarizada del handler. En caso de éxito devuelve
 *                            el programa actualizado (status 200). En caso de error devuelve
 *                            un objeto de error con el código HTTP correspondiente.
 *
 * Estructura esperada del payload parseado (formPayload):
 *  - sk {string}                     : Sort key/identificador del programa/viaje.
 *  - amount {number|string}          : Monto del pago.
 *  - paymentObservation {string}     : Observaciones del pago.
 *  - files {Array<FileLike>}         : Array de archivos; se usa el primer elemento como `file`.
 *
 * Efectos secundarios:
 *  - Sube el archivo al servicio correspondiente (vía `uploadFile`).
 *  - Modifica y persiste el registro del programa en la base de datos.
 */
export const main = async (event) => {
  console.log("event ==>", event);
  const action = "Ingreso de balance al viaje.";
  const formPayload = await parser.parse(event);
  const file = formPayload.files?.[0];
  const requiredFields = ["sk", "amount", "files", "paymentObservation"];
  const missing = requiredFields.filter((f) => !formPayload[f]);

  try {
    if (missing.length)
      return unsuccessful(
        400,
        { message: `Faltan campos requeridos: ${missing.join(", ")}` },
        action
      );
    const { sk, amount, paymentObservation } = formPayload;
    const [program] = await getProgramFromDynamodb({ sortKey: sk });
    const fileUploaded = await uploadFile(file);
    const payment = {
      ...fileUploaded,
      amount,
      paymentObservation,
    };
    program.content = program.content || [];
    if (program.content.length === 0) program.content.push({});

    program.content[0].payments = program.content[0].payments || [];
    program.content[0].payments.push(payment);

    await insertPaymentToProgram(program);

    return success(200, program, action);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};
