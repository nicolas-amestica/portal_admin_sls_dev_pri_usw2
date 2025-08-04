/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
/* eslint-disable no-async-promise-executor */
/* eslint-disable func-names */
/* eslint-disable no-async-promise-executor */
import AWS from 'aws-sdk';

const { IS_OFFLINE, AWS_PROFILE, PROFILE } = process.env;

let dynamoDb;
if (IS_OFFLINE === 'true') {
  const origin = new AWS.SharedIniFileCredentials({ profile: AWS_PROFILE || PROFILE });
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    // region: 'localhost',
    // endpoint: 'http://localhost:8000',
    // accessKeyId: 'dmartinezbello@gmail.com',
    // secretAccessKey: 'dmartinezbello@gmail.com',
    region     : 'us-west-2',
    credentials: origin,
  });
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
}

export const awsdynamodb = dynamoDb;

/**
 * Realiza una búsqueda en toda la tabla de datos sin importar el tamaño de la tabla.
 * @link  (AWS DynamoDB Scan: {@linkplain:https://docs.aws.amazon.com/es_es/amazondynamodb/latest/APIReference/API_Scan.html})
 * @param {json} params: Parámetros para ejecutar el método scan a la tabla de datos.
 * @returns {promise<Array{}>}: Todos o ningún dato que cumpla con los criterios del filtro (params).
 * */
function iterativeScan(params) {
  return new Promise(async function (resolve, reject) {
    let continuar = true;
    const items   = [];
    do {
      const response = await dynamoDb.scan(params).promise();
      items.push(...response.Items);
      if (response.LastEvaluatedKey) {
        params.LastEvaluatedKey = response.LastEvaluatedKey;
      } else continuar = false;
    } while (continuar);
    resolve(items);
  });
}

export function call(action, params) {
  if (action === 'scan') return iterativeScan(params);
  return dynamoDb[action](params).promise();
}

/**
 * Construye objeto de filtro que verifica que el valor de un atributo dado esté contenido dentro de la lista dada
 * @param {String} attribute nombre del atributo
 * @param {Array} filterData lista de posibles valores
 * @returns {json}
 */
export function conditionExpresionIn(attribute, filterData) {
  const ExpressionAttributeValues = {};
  filterData.forEach((value, index) => {
    const titleKey                                 = `:${attribute}_${index + 1}`;
    ExpressionAttributeValues[titleKey.toString()] = value;
  });
  const FilterExpression = `${attribute} IN (${Object.keys(ExpressionAttributeValues).toString()})`;
  return {FilterExpression, ExpressionAttributeValues};
}

/**
 * Configura la instancia de conexión de la base de datos
 * @param {object} options
 * @returns {void}
 */
export function setOptions(options) {
  if (IS_OFFLINE === 'true') {
    const credentials = new AWS.SharedIniFileCredentials({ profile: AWS_PROFILE });
    dynamoDb = new AWS.DynamoDB.DocumentClient({
      region: 'us-west-2',
      credentials,
      ...options,
    });
  } else {
    dynamoDb = new AWS.DynamoDB.DocumentClient(options);
  }
}
