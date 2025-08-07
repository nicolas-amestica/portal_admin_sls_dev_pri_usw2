import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";
import { fromIni } from "@aws-sdk/credential-providers";

const { AWS_REGION, PROFILE, IS_OFFLINE } = process.env;

// Configuración de cliente SSM
let ssmClient;

if (IS_OFFLINE === "true") {
  ssmClient = new SSMClient({
    region: AWS_REGION,
    credentials: fromIni({ profile: PROFILE })
  });
} else {
  ssmClient = new SSMClient({ region: AWS_REGION });
}

/**
 * Obtiene parámetros del AWS Systems Manager Parameter Store.
 *
 * @async
 * @function
 * @param {string[]} secretsKeys - Lista de nombres de los parámetros a obtener.
 * @returns {Promise<Object[]|null>} Retorna un arreglo de parámetros si existen, o null en caso de error o si no se encuentran.
 */
export const getParameterStore = async (secretsKeys) => {
  try {
    const command = new GetParametersCommand({
      Names: secretsKeys,
      WithDecryption: true,
    });

    const { Parameters } = await ssmClient.send(command);

    return Parameters ?? null;
  } catch (e) {
    console.error(e);
    return null;
  }
};