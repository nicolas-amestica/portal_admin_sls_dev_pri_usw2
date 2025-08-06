import * as dynamoDbLib from "../../../libs/dynamodb-v3";

const { DYNAMODB_USER_TABLE } = process.env;

/**
 * Obtiene el perfil de acceso de un usuario desde DynamoDB según el perfil proporcionado.
 *
 * @async
 * @function
 * @param {string} profile - El identificador del perfil a consultar.
 * @returns {Promise<Object>} Una promesa que resuelve con el resultado de la consulta a DynamoDB.
 */
export const getAccessProfile = async (profile) => {
  const paramsPerfil = {
    TableName: DYNAMODB_USER_TABLE,
    ReturnConsumedCapacity: "TOTAL",
    KeyConditionExpression: "#pk = :pk And #sk = :sk",
    ExpressionAttributeValues: {
      ":pk": "PER#4f7cb502-4256-11ec-81d3-0242ac13000H",
      ":sk": profile,
    },
    ExpressionAttributeNames: {
      "#pk": "pk",
      "#sk": "sk",
    },
  };
  return await dynamoDbLib.query(paramsPerfil);
};
