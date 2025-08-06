const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const { AWS_REGION } = process.env;

/**
 * Cliente de AWS Secrets Manager utilizado para gestionar secretos en la región especificada.
 * 
 * @constant
 * @type {SecretsManagerClient}
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/secretsmanagerclient.html}
 */
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });

/**
 * Obtiene el valor de un secreto desde AWS Secrets Manager.
 *
 * @async
 * @function
 * @param {string} secretName - El nombre o ARN del secreto a obtener.
 * @returns {Promise<string|undefined>} El valor del secreto como string, o undefined si no se encuentra.
 * @throws Lanza un error si ocurre algún problema al obtener el secreto.
 */
export async function getSecretManagerValue(secretName) {
  try {

    const command = new GetSecretValueCommand({ SecretId: secretName });

    const response = await secretsClient.send(command);

    if (response.SecretString) {
      return response.SecretString;
    } else if (response.SecretBinary) {
      const buff = Buffer.from(response.SecretBinary, 'base64');
      return buff.toString('ascii');
    }
    return undefined;
  } catch (err) {
    console.error('Error obteniendo el secreto:', err);
    throw err;
  }
}