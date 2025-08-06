const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const { AWS_REGION } = process.env;

const secretsClient = new SecretsManagerClient({ region: AWS_REGION });

export async function getSecretManagerValue(secretName) {
  try {

    const command = new GetSecretValueCommand({ SecretId: secretName });

    const response = await secretsClient.send(command);

    if (response.SecretString) {
      return response.SecretString;
    } else if (response.SecretBinary) {
      // Si es binario, decodifica desde base64
      const buff = Buffer.from(response.SecretBinary, 'base64');
      return buff.toString('ascii');
    }
    return undefined;
  } catch (err) {
    console.error('Error obteniendo el secreto:', err);
    throw err;
  }
}