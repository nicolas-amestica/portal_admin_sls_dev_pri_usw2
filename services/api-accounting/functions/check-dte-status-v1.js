import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { getParameterValue } from '../../../libs/parameter-store.js';
import { getSiiToken, checkDteEmisionStatus } from '../../../libs/sii-dte.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';
import { decodeAccountingPk } from '../helpers/resolve-partition-key.js';

const { DYNAMODB_ACCOUNTING_TABLE, SSM_DTE_PATH, SII_HOST } = process.env;
const ACTION = 'Consultar estado DTE emitido';

/** Caché SSM en módulo: se reutiliza entre invocaciones del mismo contenedor. */
let cachedConfig = null;

async function getDteConfig() {
  if (cachedConfig) return cachedConfig;
  const [certPem, llavePem, rutEmpresa] = await Promise.all([
    getParameterValue(`${SSM_DTE_PATH}/certificado-pem`),
    getParameterValue(`${SSM_DTE_PATH}/llave-pem`),
    getParameterValue(`${SSM_DTE_PATH}/rut-empresa`),
  ]);
  cachedConfig = { certPem, llavePem, rutEmpresa };
  return cachedConfig;
}

/**
 * Consulta el estado de un DTE emitido en el SII y actualiza el ingreso si cambió.
 *
 * GET /v1/contabilidad/dte/estado?sk=ING%23...&pk=USR%23...
 */
const handler = async (event) => {
  const sk = decodeURIComponent(event.queryStringParameters?.sk ?? '');
  const partitionKey = decodeAccountingPk(event.queryStringParameters?.pk);

  if (!sk || !partitionKey) {
    const error = new Error('Los parámetros sk y pk (query) son requeridos.');
    error.statusCode = 400;
    throw error;
  }

  const ingreso = await dynamoDbLib.getOne({
    TableName: DYNAMODB_ACCOUNTING_TABLE,
    Key: { pk: partitionKey, sk },
  });

  if (!ingreso) {
    const error = new Error('Ingreso no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const { dteFolio, dteTipo, fecha, montoTotal, dteStatus: statusActual } = ingreso;
  if (!dteFolio) {
    const error = new Error('El ingreso no tiene folio DTE asignado. Emita el DTE primero.');
    error.statusCode = 422;
    throw error;
  }

  const config = await getDteConfig();
  const token = await getSiiToken(config.certPem, config.llavePem, SII_HOST);

  const { estado, glosa, dteStatus } = await checkDteEmisionStatus({
    token,
    rutEmpresa: config.rutEmpresa,
    tipoDte: dteTipo ?? 39,
    folio: dteFolio,
    fecha,
    monto: montoTotal,
    siiHost: SII_HOST,
  });

  if (dteStatus !== statusActual) {
    const now = new Date().toISOString();
    await dynamoDbLib.update({
      TableName: DYNAMODB_ACCOUNTING_TABLE,
      Key: { pk: ingreso.pk, sk: ingreso.sk },
      UpdateExpression: 'SET dteStatus = :s, dteError = :e, updatedAt = :u',
      ExpressionAttributeValues: { ':s': dteStatus, ':e': glosa ?? null, ':u': now },
    });
  }

  return success(200, { estado, glosa, dteStatus }, ACTION);
};

export const main = standardMiddleware(handler);
