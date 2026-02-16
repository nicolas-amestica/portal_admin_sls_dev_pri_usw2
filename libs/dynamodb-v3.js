import { getAWSConfigs } from "./configs";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

let dynamoDb;

/**
 * Inicializa el cliente de DynamoDB utilizando la configuración de AWS obtenida.
 *
 * @async
 * @function
 * @returns {Promise<void>} Una promesa que se resuelve cuando el cliente ha sido inicializado.
 */
const initClient = async () => {
  const config = await getAWSConfigs();

  dynamoDb = new DynamoDBClient(config);
};

/**
 * Realiza una consulta (query) en DynamoDB utilizando los parámetros proporcionados.
 *
 * @async
 * @function
 * @param {Object} params - Parámetros para la consulta de DynamoDB.
 * @returns {Promise<Array<Object>|null|Error>} Retorna un arreglo de ítems si existen resultados,
 * null si no se encontraron ítems, o un error si ocurre una excepción.
 */
export const query = async (params) => {
  try {
    if (!dynamoDb) await initClient();
    const command = new QueryCommand(params);
    const result = await dynamoDb.send(command);

    const { Items } = result;
    if (!Items || Items.length === 0) return null;
    return Items;
  } catch (e) {
    console.log("DYNAMODB_QUERY_ERROR", {
      error: e.message,
      code: e.code,
      statusCode: e.$metadata?.httpStatusCode
    });
    return e;
  }
};

/**
 * Obtiene un solo elemento de DynamoDB según los parámetros proporcionados.
 *
 * @async
 * @function
 * @param {Object} params - Parámetros para la consulta GetCommand de DynamoDB.
 * @returns {Promise<Object|null|Error>} Retorna el elemento encontrado, null si no existe, o un error si ocurre una excepción.
 */
export const getOne = async (params) => {
  try {
    if (!dynamoDb) await initClient();
    const command = new GetCommand(params);
    const { Item } = await dynamoDb.send(command);

    if (!Item) return null;
    return Item;
  } catch (e) {
    return e;
  }
};

/**
 * Realiza una consulta iterativa en DynamoDB utilizando paginación automática.
 * Ejecuta múltiples solicitudes Query hasta que se hayan recuperado todos los elementos.
 *
 * @async
 * @param {Object} params - Parámetros para la consulta Query de DynamoDB.
 * @returns {Promise<Array|Error>} Una promesa que resuelve con un array de elementos recuperados o un error si ocurre una excepción.
 */
export const iterativeQuery = async (params) => {
  try {
    if (!dynamoDb) await initClient();
    let lastEvaluatedKey = null;
    let items = [];
    do {
      const command = new QueryCommand({
        ...params,
        ExclusiveStartKey: lastEvaluatedKey || undefined,
      });
      // eslint-disable-next-line no-await-in-loop
      const { Items, LastEvaluatedKey } = await dynamoDb.send(command);
      items = [...items, ...(Items || [])];
      lastEvaluatedKey = LastEvaluatedKey;
    } while (lastEvaluatedKey);
    return items;
  } catch (e) {
    return e;
  }
};

/**
 * Inserta un nuevo elemento en DynamoDB utilizando los parámetros proporcionados.
 * 
 * @async
 * @function
 * @param {Object} params - Parámetros para la operación Put en DynamoDB. Debe incluir al menos la propiedad `Item` con el objeto a insertar.
 * @returns {Promise<Object|null|Error>} Devuelve el objeto insertado si `params.Item` está presente, `null` si no hay `Item`, o un error si ocurre una excepción.
 */
export const put = async (params) => {
  params = { ...params, ReturnConsumedCapacity: "TOTAL" };
  try {
    if (!dynamoDb) await initClient();
    const command = new PutCommand(params);
    await dynamoDb.send(command);
    if (!params?.Item) return null;
    return params.Item;
  } catch (e) {
    return e;
  }
};

/**
 * Elimina un elemento de DynamoDB según los parámetros proporcionados.
 *
 * @async
 * @function
 * @param {Object} params - Parámetros para la operación de eliminación, incluyendo la clave primaria del elemento.
 * @param {Object} params.Key - Clave primaria del elemento a eliminar.
 * @returns {Promise<Object|null|Error>} Devuelve la clave del elemento eliminado si existe, null si no se encontró el elemento, o un error si ocurre una excepción.
 */
export const remove = async (params) => {
  params = { ...params, ReturnValues: "ALL_OLD" };
  try {
    if (!dynamoDb) await initClient();
    const command = new DeleteCommand(params);
    const { Attributes } = await dynamoDb.send(command);

    if (!Attributes) return null;
    return params.Key;
  } catch (e) {
    return e;
  }
};

/**
 * Actualiza un elemento en DynamoDB y retorna los atributos actualizados.
 *
 * @async
 * @function
 * @param {Object} params - Parámetros para la operación de actualización en DynamoDB.
 * @returns {Promise<Object|null|Error>} Retorna los atributos actualizados del elemento, 
 * null si no hay atributos, o un error si ocurre una excepción.
 */
export const update = async (params) => {
  params = { ...params, ReturnValues: "ALL_NEW" };
  try {
    if (!dynamoDb) await initClient();
    const command = new UpdateCommand(params);
    const { Attributes } = await dynamoDb.send(command);

    if (!Attributes) return null;

    return Attributes;
  } catch (e) {
    return e;
  }
};

/**
 * Realiza una operación de escaneo (scan) en DynamoDB utilizando los parámetros proporcionados.
 *
 * @async
 * @function
 * @param {Object} params - Parámetros para la operación de escaneo de DynamoDB.
 * @returns {Promise<Array<Object>|Error>} Retorna una promesa que resuelve a un arreglo de objetos deserializados si hay resultados,
 * o un arreglo vacío si no hay elementos. En caso de error, retorna el error capturado.
 */
export const scan = async (params) => {
  try {
    if (!dynamoDb) await initClient();
    const command = new ScanCommand(params);
    const { Items } = await dynamoDb.send(command);

    if (!Items || Items.length === 0) return [];
    return Items.map((item) => unmarshall(item));
  } catch (e) {
    return e;
  }
};
