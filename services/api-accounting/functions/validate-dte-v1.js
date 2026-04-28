import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { getParameterValue } from '../../../libs/parameter-store.js';
import { getSiiToken, queryDteRecibido } from '../../../libs/sii-dte.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';
import { decodeAccountingPk } from '../helpers/resolve-partition-key.js';

const { DYNAMODB_ACCOUNTING_TABLE, SSM_DTE_PATH, SII_HOST } = process.env;
const ACTION = 'Validar DTE recibido';

/** Caché en módulo: se reutiliza entre invocaciones del mismo contenedor Lambda. */
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
 * Verifica si un gasto registrado como FACTURA existe en el Registro de Compras del SII.
 * Si la validación es exitosa, actualiza el gasto con dteValidado = true.
 *
 * GET /v1/contabilidad/dte/validar-factura?sk=EXP%23...&pk=USR%23...
 */
const handler = async (event) => {
  const sk = decodeURIComponent(event.queryStringParameters?.sk ?? '');
  const partitionKey = decodeAccountingPk(event.queryStringParameters?.pk);

  if (!sk || !partitionKey) {
    const error = new Error('Los parámetros sk y pk (query) son requeridos.');
    error.statusCode = 400;
    throw error;
  }

  const gasto = await dynamoDbLib.getOne({
    TableName: DYNAMODB_ACCOUNTING_TABLE,
    Key: { pk: partitionKey, sk },
  });

  if (!gasto) {
    const error = new Error('Gasto no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const { folio, rutEmisor, fecha, monto } = gasto;
  if (!folio || !rutEmisor) {
    const error = new Error('El gasto no tiene folio ni RUT del emisor registrados. No se puede validar con el SII.');
    error.statusCode = 422;
    throw error;
  }

  const tipo = gasto.tipoDocumento === 'FACTURA_EXENTA' ? '34' : '33';

  const { certPem, llavePem, rutEmpresa } = await getDteConfig();
  const token = await getSiiToken(certPem, llavePem, SII_HOST);

  const resultado = await queryDteRecibido({
    token,
    rutEmpresa,
    rutEmisor,
    folio,
    tipo,
    fecha,
    monto,
    siiHost: SII_HOST,
  });

  if (resultado.existe) {
    const now = new Date().toISOString();
    await dynamoDbLib.update({
      TableName: DYNAMODB_ACCOUNTING_TABLE,
      Key: { pk: gasto.pk, sk: gasto.sk },
      UpdateExpression: 'SET dteValidado = :v, dteValidadoTimestamp = :t, updatedAt = :u',
      ExpressionAttributeValues: { ':v': true, ':t': now, ':u': now },
    });
  }

  return success(200, resultado, ACTION);
};

export const main = standardMiddleware(handler);
