import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';

const APP_PROFILES_PK = 'APP#PROFILES';
const APP_PROFILE_USER_PK = 'APP#PROFILE#USER';
const APP_ADMIN_PORTAL_PK = 'APP#ADMIN_PORTAL';

/**
 * @description Obtiene el id canónico del perfil desde el ítem (campo id o sufijo sk PFL#).
 */
export const resolveProfilePkId = (item) => {
  if (!item) return '';
  const fromSk =
    typeof item.sk === 'string' && item.sk.startsWith('PFL#') ? item.sk.replace(/^PFL#/, '') : '';
  return (item.id && String(item.id)) || fromSk || '';
};

/**
 * @description Normaliza título para comparar (trim, lowercase, sin acentos comunes).
 */
const normalizeProfileTitle = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase();

/**
 * @description Busca en DynamoDB el perfil IAM cuyo nombre/título es «Cliente».
 * Usa iterativeQuery para cubrir toda la partición APP#PROFILES.
 */
export const findClienteProfileRecord = async (tableName) => {
  const items =
    (await dynamoDbLib.iterativeQuery({
      TableName: tableName,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': APP_PROFILES_PK },
    })) ?? [];

  const byExactCliente = (p) => {
    const t = normalizeProfileTitle(p.title);
    const n = normalizeProfileTitle(p.nombre ?? p.fullName ?? p.label);
    return t === 'cliente' || n === 'cliente';
  };

  let found = items.find(byExactCliente);

  if (!found) {
    /** Ej. «Perfil Cliente», «Cliente viaje» → preferir donde el tramo cliente sea destacable. */
    found = items.find((p) => {
      const t = normalizeProfileTitle(p.title);
      return t.endsWith('cliente') || t.startsWith('cliente ') || /\bcliente\b/.test(t);
    });
  }

  const id = found ? resolveProfilePkId(found) : '';
  if (!found || !id) return null;
  return { ...found, id };
};

/**
 * @description Crea la fila APP#PROFILE#USER para el usuario y el perfil Cliente si aún no existe.
 * Ya no usa «tiene cualquier perfil» como veto: otros perfiles pueden existir pero sin Cliente.
 */
export const ensureClienteProfileForPortalUser = async (tableName, email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return;

  const profile = await findClienteProfileRecord(tableName);
  if (!profile?.id) {
    const err = new Error(
      'Configuración incompleta: no existe el perfil IAM «Cliente» en DynamoDB (pk APP#PROFILES).',
    );
    err.statusCode = 500;
    throw err;
  }

  const userProfileSk = `UPL#USR#${normalizedEmail}#${APP_ADMIN_PORTAL_PK}#PFL#${profile.id}`;
  const already = await dynamoDbLib.getOne({
    TableName: tableName,
    Key: { pk: APP_PROFILE_USER_PK, sk: userProfileSk },
  });
  if (already) return;

  const now = new Date().toISOString();
  await dynamoDbLib.put({
    TableName: tableName,
    Item: {
      pk: APP_PROFILE_USER_PK,
      sk: userProfileSk,
      title: (profile.title || 'Cliente').trim(),
      expiration: 'null',
      createdAt: now,
    },
  });
};
