const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const secretsClient = new SecretsManagerClient({ region: 'us-west-2' }); // Cambia la región si es necesario

export async function getSecretManagerValue(secretName) {
  try {

    const command = new GetSecretValueCommand({ SecretId: secretName });

    const response = await secretsClient.send(command);

    console.log("response ==>", response);

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