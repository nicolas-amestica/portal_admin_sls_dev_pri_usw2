import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import * as s3Lib from '../../../libs/s3-v3.js';
import { getParameterValue } from '../../../libs/parameter-store.js';
import { buildAndSignBoleta39, buildAndSignEnvioDte, sendDteToSii, getSiiToken } from '../../../libs/sii-dte.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';
import { normalizeOwnerPk } from '../helpers/owner-pk.js';

const { DYNAMODB_ACCOUNTING_TABLE, BUCKET_INFO_GI, SSM_DTE_PATH, SII_HOST } = process.env;
const ACTION = 'Emitir DTE boleta electrónica';

/** Caché SSM: se reutiliza entre invocaciones del mismo contenedor Lambda. */
let cachedConfig = null;

/** Caché CAF por tipo: TTL 1 hora para evitar múltiples GetObject en invocaciones warm. */
const cafCache = {};

async function getDteConfig() {
  if (cachedConfig) return cachedConfig;
  const names = [
    'certificado-pem', 'llave-pem', 'rut-empresa', 'razon-social',
    'giro', 'direccion', 'comuna', 'ciudad', 'nro-resolucion', 'fch-resolucion',
  ];
  const values = await Promise.all(names.map((n) => getParameterValue(`${SSM_DTE_PATH}/${n}`)));
  cachedConfig = {
    certPem: values[0], llavePem: values[1], rutEmpresa: values[2],
    razonSocial: values[3], giro: values[4], direccion: values[5],
    comuna: values[6], ciudad: values[7], nroResolucion: values[8], fchResolucion: values[9],
  };
  return cachedConfig;
}

async function getCafXml(tipoDte) {
  const now = Date.now();
  if (cafCache[tipoDte] && now - cafCache[tipoDte].loadedAt < 3_600_000) return cafCache[tipoDte].xml;
  const response = await s3Lib.getObject({ Bucket: BUCKET_INFO_GI, Key: `dte/caf/caf-${tipoDte}.xml` });
  const xml = await response.Body.transformToString();
  cafCache[tipoDte] = { xml, loadedAt: now };
  return xml;
}

/**
 * Incrementa atómicamente el folio. Lanza 422 si el CAF está agotado o no inicializado.
 *
 * @param {number} tipoDte - Tipo de DTE (39, 33, 34, 61).
 * @returns {Promise<number>} Nuevo folio asignado.
 */
async function obtenerFolioAtomico(tipoDte) {
  try {
    const result = await dynamoDbLib.update({
      TableName: DYNAMODB_ACCOUNTING_TABLE,
      Key: { pk: 'CFG#DTE', sk: `FOLIO#${tipoDte}` },
      UpdateExpression: 'ADD folioActual :uno',
      ConditionExpression: 'attribute_exists(pk) AND folioActual <= cafRangoHasta',
      ExpressionAttributeValues: { ':uno': 1 },
    });
    return result.folioActual;
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      const error = new Error(`CAF para tipo ${tipoDte} agotado o no inicializado. Solicite nuevos folios en sii.cl y actualice el contador.`);
      error.statusCode = 422;
      throw error;
    }
    throw err;
  }
}

/**
 * Emite un DTE tipo 39 (boleta electrónica) para un ingreso registrado.
 * Obtiene folio atómico → construye y firma DTE → envía al SII.
 *
 * POST /v1/contabilidad/dte/emitir
 * Body: { sk, pk }
 */
const handler = async (event) => {
  const { sk, pk } = event.body ?? {};
  const owner = normalizeOwnerPk(pk);
  if (!sk || !owner) {
    const error = new Error('Los parámetros sk y pk (partition key USR#...) son requeridos.');
    error.statusCode = 400;
    throw error;
  }

  const ingreso = await dynamoDbLib.getOne({
    TableName: DYNAMODB_ACCOUNTING_TABLE,
    Key: { pk: owner.pk, sk },
  });

  if (!ingreso) {
    const error = new Error('Ingreso no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  if (ingreso.dteStatus === 'ACEPTADO' || ingreso.dteStatus === 'PROCESANDO') {
    const error = new Error(`El ingreso ya tiene un DTE en estado ${ingreso.dteStatus}.`);
    error.statusCode = 409;
    throw error;
  }

  const tipoDte = 39;
  const [config, cafXml] = await Promise.all([getDteConfig(), getCafXml(tipoDte)]);
  const folio = await obtenerFolioAtomico(tipoDte);

  const signedDte = await buildAndSignBoleta39(ingreso, folio, cafXml, config);
  const signedEnvioDte = await buildAndSignEnvioDte(signedDte, tipoDte, config);

  const token = await getSiiToken(config.certPem, config.llavePem, SII_HOST);
  const { trackId, estado } = await sendDteToSii(token, signedEnvioDte, config, SII_HOST);

  const dteStatus = (estado === 'EPR' || estado === '') ? 'PROCESANDO' : 'RECHAZADO';
  const now = new Date().toISOString();

  await dynamoDbLib.update({
    TableName: DYNAMODB_ACCOUNTING_TABLE,
    Key: { pk: ingreso.pk, sk: ingreso.sk },
    UpdateExpression: 'SET dteStatus = :s, dteTrackId = :t, dteFolio = :f, dteTipo = :tp, dteTimestamp = :ts, updatedAt = :u',
    ExpressionAttributeValues: {
      ':s': dteStatus, ':t': trackId, ':f': folio,
      ':tp': tipoDte, ':ts': now, ':u': now,
    },
  });

  return success(200, { folio, trackId, dteStatus }, ACTION);
};

export const main = standardMiddleware(handler);
