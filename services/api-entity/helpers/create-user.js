import bcrypt from 'bcryptjs';
import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';

const APP_PK = 'APP#ADMIN_PORTAL';
const APP_PROFILE_USER_PK = 'APP#PROFILE#USER';
const PROFILES_PK = 'APP#PROFILES';

/** Genera una contraseña temporal que cumple requisitos básicos de complejidad. */
const generateTemporaryPassword = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$';
  const all = upper + lower + digits + special;
  let pass =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    special[Math.floor(Math.random() * special.length)];
  for (let i = 4; i < 12; i++) pass += all[Math.floor(Math.random() * all.length)];
  return pass
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

/**
 * Crea un usuario en el portal con perfiles opcionales.
 * Idempotente: si el email ya existe retorna el usuario existente sin error.
 * Nunca usa Scan — todas las lecturas son Query por PK/GSI o BatchGetItem.
 *
 * @param {{ email: string, fullName: string, gsiOne: string, phoneNumber?: string,
 *   profiles?: { id: string, title: string }[], password?: string,
 *   metadata?: { source?: string, programSk?: string } }} input
 * @param {string} tableName - Nombre de la tabla DynamoDB de usuarios.
 * @returns {Promise<{ user: object, generatedPassword: string|null, isExisting: boolean }>}
 */
export const createPortalUser = async (
  { email, fullName, gsiOne, phoneNumber, profiles = [], password, metadata = {} },
  tableName,
) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    const err = new Error('email es requerido');
    err.statusCode = 400;
    throw err;
  }

  // 1. Verificar duplicado por GSI email-index (Query, sin Scan)
  const existing = await dynamoDbLib.query({
    TableName: tableName,
    IndexName: 'email-index',
    KeyConditionExpression: '#email = :email',
    ExpressionAttributeValues: { ':email': normalizedEmail },
    ExpressionAttributeNames: { '#email': 'email' },
  });

  if (existing?.length) {
    return { user: existing[0], generatedPassword: null, isExisting: true };
  }

  // 2. Validar perfiles solicitados con BatchGetItem (sin Scan)
  if (profiles.length > 0) {
    const profileKeys = profiles.map(({ id }) => ({ pk: PROFILES_PK, sk: `PFL#${id}` }));
    const batchResult = await dynamoDbLib.batchGet({
      RequestItems: { [tableName]: { Keys: profileKeys } },
    });
    const foundIds = (batchResult?.[tableName] ?? []).map((p) => p.sk.replace(/^PFL#/, ''));
    const missing = profiles.filter(({ id }) => !foundIds.includes(id)).map(({ id }) => id);
    if (missing.length > 0) {
      const err = new Error(`Perfiles no encontrados: ${missing.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
  }

  // 3. Generar credenciales
  const userId = uuidv7();
  const generatedPassword = password ?? generateTemporaryPassword();
  const hashedPassword = await bcrypt.hash(generatedPassword, 10);
  const now = new Date().toISOString();
  const contentEntry = metadata.programSk
    ? [{ createdAt: now, program: metadata.programSk, isActive: true }]
    : [];

  // 4. Escribir authRecord + dirRecord en paralelo
  const authRecord = {
    pk: `USR#${userId}`,
    sk: `USR#${userId}`,
    id: userId,
    email: normalizedEmail,
    fullName: fullName || '',
    gsiOne: gsiOne || '',
    phoneNumber: phoneNumber || null,
    password: hashedPassword,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    content: contentEntry,
  };

  const dirRecord = {
    pk: 'APP#USERS',
    sk: `USR#${normalizedEmail}`,
    id: userId,
    email: normalizedEmail,
    fullName: fullName || '',
    gsiOne: gsiOne || '',
    isActive: true,
    phoneNumber: phoneNumber || null,
    createdAt: now,
    updatedAt: now,
  };

  await Promise.all([
    dynamoDbLib.put({ TableName: tableName, Item: authRecord }),
    dynamoDbLib.put({ TableName: tableName, Item: dirRecord }),
  ]);

  // 5. Asignar perfiles si se indicaron
  if (profiles.length > 0) {
    await Promise.all(
      profiles.map(({ id, title }) =>
        dynamoDbLib.put({
          TableName: tableName,
          Item: {
            pk: APP_PROFILE_USER_PK,
            sk: `UPL#USR#${normalizedEmail}#${APP_PK}#PFL#${id}`,
            title: title || '',
            expiration: 'null',
            createdAt: now,
          },
        }),
      ),
    );
  }

  const user = {
    id: userId,
    email: normalizedEmail,
    fullName: fullName || '',
    gsiOne: gsiOne || '',
    phoneNumber: phoneNumber || null,
    isActive: true,
    profiles: profiles.map(({ id }) => id),
    createdAt: now,
  };

  return { user, generatedPassword: password ? null : generatedPassword, isExisting: false };
};
