import { fromIni } from "@aws-sdk/credential-providers";

const { AWS_REGION, STAGE, IS_OFFLINE } = process.env;

/**
 * Obtiene la configuración de AWS según el entorno de ejecución.
 *
 * @async
 * @function
 * @returns {Promise<Object>} Un objeto con la región de AWS y, si se ejecuta offline, las credenciales del perfil correspondiente.
 *
 * @description
 * - Selecciona el perfil de AWS basado en la variable global `STAGE` (dev, qa, prd).
 * - Si la variable global `IS_OFFLINE` es "true", retorna la región y las credenciales del perfil.
 * - Si no, retorna solo la región.
 */
export const getAWSConfigs = async () => {
  let profile;
  if (STAGE === "dev") profile = `pa-${STAGE}`;
  if (STAGE === "qa") profile = `pa-${STAGE}`;
  if (STAGE === "prd") profile = `pa-${STAGE}`;

  if (IS_OFFLINE === "true")
    return { region: AWS_REGION, credentials: fromIni({ profile }) };

  return { region: AWS_REGION };
};
