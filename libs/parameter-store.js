import { config } from 'dotenv';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { createHash } from 'crypto';
import { SSMClient, GetParameterCommand, GetParametersCommand } from '@aws-sdk/client-ssm';

// Compatibilidad con ESM y CJS
let __filename;
let __dirname;

if (typeof import.meta !== 'undefined' && import.meta.url) {
  __filename = fileURLToPath(import.meta.url);
  __dirname = dirname(__filename);
} else {
  __filename = typeof __filename !== 'undefined' ? __filename : '';
  __dirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
}

// Busca el .env navegando hacia arriba desde el directorio actual
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
  const result = config({ path: envPath });

  if (result.error)
    console.log('[PARAMETER-STORE] Error cargando .env:', result.error.message);
  else
    console.log('[PARAMETER-STORE] ✓ Variables de entorno cargadas exitosamente');
} else {
  console.log('[PARAMETER-STORE] ⚠️  No se encontró archivo .env en la estructura de directorios');
}

const { AWS_REGION, IS_OFFLINE } = process.env;

/**
 * Cliente de AWS SSM utilizado para obtener parámetros desde Parameter Store.
 *
 * @constant
 * @type {SSMClient}
 */
const ssmClient = new SSMClient({ region: AWS_REGION });

/**
 * Obtiene el valor de un parámetro desde AWS SSM Parameter Store o variables de entorno en modo local.
 *
 * @async
 * @function
 * @param {string} parameterName - La ruta del parámetro SSM a obtener (e.g. `/pa/dev/jwt-key`).
 * @returns {Promise<string|undefined>} El valor del parámetro como string, o undefined si no se encuentra.
 * @throws Lanza un error si ocurre algún problema al obtener el parámetro.
 *
 * @description
 * En ambiente local (IS_OFFLINE=true), obtiene los valores desde variables de entorno
 * en lugar de SSM Parameter Store. Esto permite el desarrollo local sin credenciales AWS.
 *
 * Para configuración de email en local, se esperan las siguientes variables de entorno:
 * - EMAIL_HOST: Host del servidor SMTP
 * - EMAIL_PORT: Puerto del servidor SMTP
 * - EMAIL_SECURE: Si usar SSL/TLS (true/false)
 * - EMAIL_USER: Usuario para autenticación SMTP
 * - EMAIL_PASSWORD: Contraseña para autenticación SMTP
 *
 * Para otros parámetros, se espera una variable de entorno con el nombre del parámetro
 * transformado: se toma el último segmento del path y se convierte a UPPERCASE con guiones
 * reemplazados por guiones bajos. Ejemplo: `/pa/dev/jwt-key` → `JWT_KEY`.
 */
export async function getParameterValue(parameterName) {
  try {
    if (!parameterName) {
      throw new Error('parameterName es requerido.');
    }

    // En ambiente local, usar variables de entorno en lugar de SSM Parameter Store
    if (IS_OFFLINE === 'true') {
      // Mapeo especial para email-config: construir JSON desde vars individuales
      if (parameterName.includes('email-config')) {
        const emailConfig = {
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT || '587', 10),
          secure: process.env.EMAIL_SECURE === 'true',
          user: process.env.EMAIL_USER,
          password: process.env.EMAIL_PASSWORD
        };

        if (!emailConfig.user || !emailConfig.password) {
          throw new Error(
            'Credenciales de email no configuradas. ' +
            'Por favor, configura EMAIL_USER y EMAIL_PASSWORD en tu archivo .env'
          );
        }

        return JSON.stringify(emailConfig);
      }

      // Para otros parámetros, tomar el último segmento del path y convertir a UPPERCASE
      const segments = parameterName.split('/').filter(Boolean);
      const envVarName = segments[segments.length - 1].toUpperCase().replace(/-/g, '_');
      const envValue = process.env[envVarName];

      if (!envValue) {
        throw new Error(
          `Parámetro ${parameterName} no encontrado en variables de entorno. ` +
          `Verifica que ${envVarName} esté configurado en tu archivo .env`
        );
      }

      return envValue;
    }

    // En ambiente AWS, obtener desde SSM Parameter Store con descifrado
    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true
    });

    const response = await ssmClient.send(command);

    const value = response.Parameter?.Value;
    if (!value) return value;

    let manifest;
    try {
      manifest = JSON.parse(value);
    } catch {
      return value;
    }
    if (manifest?.format !== 'ssm-standard-chunks-v1' || !Array.isArray(manifest.parts) || !manifest.sha256) {
      return value;
    }

    const partsResponse = await ssmClient.send(new GetParametersCommand({
      Names: manifest.parts,
      WithDecryption: true,
    }));
    if (partsResponse.InvalidParameters?.length || partsResponse.Parameters?.length !== manifest.parts.length) {
      throw new Error(`Parámetro fragmentado incompleto: ${parameterName}`);
    }
    const valuesByName = new Map(partsResponse.Parameters.map((part) => [part.Name, part.Value]));
    const reconstructed = manifest.parts.map((name) => valuesByName.get(name) ?? '').join('');
    const digest = createHash('sha256').update(reconstructed).digest('hex');
    if (digest !== manifest.sha256) {
      throw new Error(`Integridad inválida para parámetro fragmentado: ${parameterName}`);
    }
    return reconstructed;
  } catch (err) {
    console.error('Error obteniendo el parámetro SSM:', err);
    throw err;
  }
}
