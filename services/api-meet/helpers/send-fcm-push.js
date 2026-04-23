import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getOne } from '../../../libs/dynamodb-v3.js';
import { getParameterValue } from '../../../libs/parameter-store.js';

const FCM_PK = 'FCM_TOKENS';
const FCM_SK = 'ALL';
const { FCM_SSM_PARAM, DYNAMODB_CONFIG_TABLE } = process.env;

/** Inicializa Firebase Admin una sola vez por ciclo de vida de la Lambda. */
async function ensureFirebaseInitialized() {
  if (getApps().length > 0) return;
  const json = await getParameterValue(FCM_SSM_PARAM);
  initializeApp({ credential: cert(JSON.parse(json)) });
}

/**
 * Obtiene todos los tokens FCM registrados en la config table.
 *
 * @returns {Promise<string[]>} Lista de tokens FCM activos.
 */
export async function getAllFcmTokens() {
  const item = await getOne({
    TableName: DYNAMODB_CONFIG_TABLE,
    Key: { pk: FCM_PK, sk: FCM_SK },
  });
  return Object.values(item?.tokens ?? {}).filter(Boolean);
}

/**
 * Envía una notificación push vía FCM a múltiples tokens.
 *
 * @param {object} params
 * @param {string[]} params.tokens - Tokens FCM destino.
 * @param {string} params.title - Título de la notificación.
 * @param {string} params.body - Cuerpo del mensaje.
 * @param {Record<string, string>} [params.data] - Datos adicionales (todos strings).
 */
export async function sendFcmPush({ tokens, title, body, data = {} }) {
  if (!tokens.length) return;
  await ensureFirebaseInitialized();

  const response = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
    webpush: {
      notification: {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...(data.meetLink && { actions: [{ action: 'join', title: 'Unirse a la reunión' }] }),
      },
    },
  });

  const failed = response.responses.filter((r) => !r.success).length;
  if (failed > 0) {
    console.warn(`[FCM] ${failed} envío(s) fallido(s) de ${tokens.length} total.`);
  }
}
