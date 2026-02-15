import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Debug: verificar valor de IS_OFFLINE
console.log('[SECRET-MANAGER DEBUG] IS_OFFLINE value:', process.env.IS_OFFLINE, 'type:', typeof process.env.IS_OFFLINE);

// Cargar variables de entorno desde .env en modo local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Buscar el .env navegando hacia arriba desde el directorio actual
function findEnvFile(startDir) {
  let currentDir = startDir;
  const root = resolve('/');

  while (currentDir !== root) {
    const envPath = join(currentDir, '.env');
    if (existsSync(envPath)) {
      return envPath;
    }
    currentDir = resolve(currentDir, '..');
  }

  return null;
}

const envPath = findEnvFile(__dirname);

if (envPath) {
  console.log('[SECRET-MANAGER] .env encontrado en:', envPath);
  const result = config({ path: envPath });

  if (result.error) {
    console.log('[SECRET-MANAGER] Error cargando .env:', result.error.message);
  } else {
    console.log('[SECRET-MANAGER] ✓ Variables de entorno cargadas exitosamente');
    console.log('[SECRET-MANAGER] EMAIL_USER:', process.env.EMAIL_USER ? '✓ Configurado' : '✗ NO configurado');
    console.log('[SECRET-MANAGER] EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Configurado' : '✗ NO configurado');
  }
} else {
  console.log('[SECRET-MANAGER] ⚠️  No se encontró archivo .env en la estructura de directorios');
}

const { AWS_REGION, IS_OFFLINE } = process.env;

/**
 * Cliente de AWS Secrets Manager utilizado para gestionar secretos en la región especificada.
 *
 * @constant
 * @type {SecretsManagerClient}
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/secretsmanagerclient.html}
 */
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });

/**
 * Obtiene el valor de un secreto desde AWS Secrets Manager o variables de entorno en modo local.
 *
 * @async
 * @function
 * @param {string} secretName - El nombre o ARN del secreto a obtener.
 * @returns {Promise<string|undefined>} El valor del secreto como string, o undefined si no se encuentra.
 * @throws Lanza un error si ocurre algún problema al obtener el secreto.
 *
 * @description
 * En ambiente local (IS_OFFLINE=true), este método obtiene los secretos desde variables de entorno
 * en lugar de AWS Secrets Manager. Esto permite el desarrollo local sin necesidad de credenciales AWS.
 *
 * Para configuración de email en local, se esperan las siguientes variables de entorno:
 * - EMAIL_HOST: Host del servidor SMTP
 * - EMAIL_PORT: Puerto del servidor SMTP
 * - EMAIL_SECURE: Si usar SSL/TLS (true/false)
 * - EMAIL_USER: Usuario para autenticación SMTP
 * - EMAIL_PASSWORD: Contraseña para autenticación SMTP
 */
export async function getSecretManagerValue(secretName) {
  try {
    // En ambiente local, usar variables de entorno en lugar de Secrets Manager
    if (IS_OFFLINE === 'true') {
      console.log(`[LOCAL] Obteniendo secreto desde variables de entorno: ${secretName}`);

      // Mapeo de secretos a variables de entorno locales
      if (secretName.includes('email-config')) {
        const emailConfig = {
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT || '587', 10),
          secure: process.env.EMAIL_SECURE === 'true',
          user: process.env.EMAIL_USER,
          password: process.env.EMAIL_PASSWORD
        };

        // Validar que las credenciales estén configuradas
        if (!emailConfig.user || !emailConfig.password) {
          throw new Error(
            'Credenciales de email no configuradas. ' +
            'Por favor, configura EMAIL_USER y EMAIL_PASSWORD en tu archivo .env'
          );
        }

        return JSON.stringify(emailConfig);
      }

      // Para otros secretos, intentar obtenerlos directamente de variables de entorno
      const envVarName = secretName.toUpperCase().replace(/-/g, '_');
      const envValue = process.env[envVarName];

      if (!envValue) {
        throw new Error(
          `Secreto ${secretName} no encontrado en variables de entorno. ` +
          `Verifica que ${envVarName} esté configurado en tu archivo .env`
        );
      }

      return envValue;
    }

    // En ambiente AWS, usar Secrets Manager normalmente
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