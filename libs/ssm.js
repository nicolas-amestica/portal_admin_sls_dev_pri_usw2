import AWS from "aws-sdk";

const { AWS_REGION, PROFILE, IS_OFFLINE } = process.env;

let ssm;
ssm = new AWS.SSM({ region: AWS_REGION });

if (IS_OFFLINE === "true") {
  const origin = new AWS.SharedIniFileCredentials({ profile: PROFILE });
  ssm = new AWS.SSM({ region: AWS_REGION, credentials: origin });
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
    const { Parameters } = await ssm
      .getParameters({ Names: secretsKeys, WithDecryption: true })
      .promise();

    if (!Parameters) return null;

    return Parameters;
  } catch (e) {
    console.error(e);
    return null;
  }
};
