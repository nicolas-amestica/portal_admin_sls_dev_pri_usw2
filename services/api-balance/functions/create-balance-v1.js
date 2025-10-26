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
 *
 * @async
 * @function uploadFile
 * @param {Object} content - Objeto que describe el archivo a subir.
 * @param {string} content.filename - Nombre original del archivo (se usa para extraer la extensión).
 * @param {Buffer|Uint8Array|NodeJS.ReadableStream|string} content.content - Contenido del archivo.
 * @param {string} [content.contentType] - Tipo MIME del archivo. Si no se proporciona, se usará "application/octet-stream".
 * @throws {Error} Si la operación de subida a S3 falla o ocurre un error interno.
 * @returns {Promise<{bucket: string, ext: string, isAttached: boolean, Key: string, path: string, uploadDate: string}>} Objeto con metadatos del archivo subido:
 *  - bucket: nombre del bucket donde se almacenó el archivo.
 *  - ext: extensión del archivo (sin el punto).
 *  - isAttached: indicador de que el archivo está adjunto (true en caso de éxito).
 *  - Key: nombre del fichero generado (UUID + extensión).
 *  - path: prefijo/ruta dentro del bucket ("balances").
 *  - uploadDate: fecha ISO en la que se realizó la subida.
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
 *
 * Construye los parámetros de consulta usando la tabla DYNAMODB_PROGRAM_TABLE y la clave
 * primaria PROGRAM_TABLE_ID junto con el valor de sortKey proporcionado, realiza la
 * petición mediante dynamoDbLib.getOne y resuelve la promesa para devolver el elemento.
 *
 * @async
 * @param {Object} params - Parámetros de entrada.
 * @param {string} params.sortKey - Valor de la clave de ordenación (sk) que identifica el ítem en la tabla.
 * @returns {Promise<Object|null>} Promesa que resuelve con el objeto obtenido (balance) o null si no se encuentra.
 * @throws {Error} Propaga errores generados por dynamoDbLib.getOne o resolvePromises en caso de fallos en la consulta.
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
 *
 * @async
 * @function insertPaymentToProgram
 * @param {Object} newProgram - Objeto que representa el programa a insertar. Debe contener los atributos esperados por la tabla.
 * @returns {Promise<Object>} Promesa que resuelve con la respuesta procesada de la operación de inserción (resultado devuelto por dynamoDbLib.put y procesado por resolvePromises), incluyendo información sobre la capacidad consumida.
 * @throws {Error} Se Propaga cualquier error producido por dynamoDbLib.put o por la resolución de promesas.
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
 *
 * Proceso:
 * 1. Valida los campos requeridos en event.body.
 * 2. Verifica que exista un archivo adjunto con contenido.
 * 3. Recupera el programa desde DynamoDB usando la llave de ordenamiento (sk).
 * 4. Sube el archivo recibido a un servicio de almacenamiento.
 * 5. Construye un objeto de pago que combina la información del archivo subido con
 *    el monto y la observación del pago.
 * 6. Inserta el pago en program.content[0].payments (creando las estructuras necesarias
 *    si no existen) y persiste el cambio con insertPaymentToProgram.
 * 7. Devuelve una respuesta normalizada mediante success() o unsuccessful().
 *
 * @async
 * @function
 * @param {Object} event - Objeto del evento entrante (p. ej. payload de API Gateway / Lambda).
 * @param {Object} event.body - Cuerpo del request esperado.
 * @param {string} event.body.sk - Sort key/identificador del programa en DynamoDB.
 * @param {number|string} event.body.amount - Monto del pago a registrar.
 * @param {string} event.body.paymentObservation - Observación o nota sobre el pago.
 * @param {Object} event.body.file - Archivo adjunto que contiene el justificante del pago.
 * @param {string} event.body.file.filename - Nombre del archivo.
 * @param {Buffer|string} event.body.file.content - Contenido del archivo (binario o base64).
 * @param {string} [event.body.file.contentType] - Tipo de contenido (opcionales).
 * @param {string} [event.body.file.mimetype] - Mime type alternativo (opcional).
 *
 * @returns {Promise<Object>} Resultado normalizado de la operación. En caso de éxito
 *    suele resolverse con la estructura retornada por success(200, program, action),
 *    y en caso de error devuelve la estructura de unsuccessful(statusCode, error, action).
 *
 * @throws {Error} Lanza o devuelve errores en los siguientes casos:
 *  - Faltan campos requeridos (sk, amount o paymentObservation) -> respuesta 400.
 *  - No se proporciona un archivo adjunto con contenido -> respuesta 400.
 *  - Programa no encontrado en DynamoDB -> respuesta 404.
 *  - Errores desde getProgramFromDynamodb, uploadFile o insertPaymentToProgram -> respuesta 5xx o la que provenga del error.
 *
 * @remarks
 * - Realiza efectos secundarios (lectura/escritura en DynamoDB y subida de archivos).
 * - No modifica el input original intencionalmente; mutaciones aplicadas son sobre la copia/objeto program recuperado.
 */
const baseHandler = async (event) => {
  console.log("event ==>", event);
  const action = "Ingreso de balance al viaje.";

  try {
    const { sk, amount, paymentObservation, file } = event.body;
    const requiredFields = ["sk", "amount", "paymentObservation"];
    const missing = requiredFields.filter((f) => !event.body[f]);

    if (missing.length) return unsuccessful(400, { message: `Faltan campos requeridos: ${missing.join(", ")}` }, action);
    if (!file || !file.content) return unsuccessful(400, { message: "No se encontró archivo adjunto" }, action);

    const [program] = await getProgramFromDynamodb({ sortKey: sk });

    if (!program) return unsuccessful(404, { message: "Programa no encontrado" }, action);

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
      paymentObservation,
    };

    program.content = program.content || [];
    if (program.content.length === 0) program.content.push({});
    program.content[0].payments = program.content[0].payments || [];
    program.content[0].payments.push(payment);

    await insertPaymentToProgram(program);

    return success(200, program, action);
  } catch (e) {
    console.error("ERROR ==>", e);
    const statusCode = e.statusCode || 500;
    return unsuccessful(statusCode, e, action);
  }
};

/**
 * Handler principal compuesto para la función Lambda "create-balance-v1".
 *
 * Este export es el resultado de envolver `baseHandler` con middy y aplicar el
 * middleware `multipartBodyParser` configurado para procesar peticiones de tipo
 * multipart/form-data. El middleware utiliza busboy con un límite de tamaño por
 * archivo establecido en 5 MB (5 * 1024 * 1024 bytes).
 *
 * Propósito:
 * - Permitir el parseo automático de formularios multipart y la extracción de
 *   archivos y campos para que `baseHandler` los procese.
 *
 * Comportamiento y notas:
 * - El límite `fileSize` se aplica por archivo individual.
 * - Mantiene la firma estándar de AWS Lambda (event, context, callback) que
 *   provee `baseHandler`.
 * - Para cambiar el límite máximo de subida, modificar la propiedad `fileSize`.
 * - Si se requieren validaciones adicionales (número máximo de archivos, tamaño
 *   total, tipos MIME), deben añadirse ya sea al middleware o dentro de
 *   `baseHandler`.
 *
 * @constant
 * @name main
 * @type {import('aws-lambda').Handler}
 */
export const main = middy(baseHandler).use(
  multipartBodyParser({
    busboy: {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    },
  })
);
