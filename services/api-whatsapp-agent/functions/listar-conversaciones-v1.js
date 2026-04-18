import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { listarConversaciones } from '../helpers/chatwoot-api.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

const ACTION = 'Listar conversaciones derivadas';

/**
 * @description Lista las conversaciones abiertas en la bandeja de Chatwoot.
 * Pagina todos los resultados de Chatwoot (máx 20 páginas de 20 conv. c/u) y reemplaza
 * el unreadCount de Chatwoot con el contador DynamoDB portal-nativo.
 *
 * @param {object} event - Evento HTTP de API Gateway.
 */
export const main = async (_event) => {
  try {
    const { CONVERSATIONS_TABLE } = process.env;

    // Paginar Chatwoot hasta traer todas las conversaciones abiertas.
    const MAX_PAGES = 20;
    const PAGE_SIZE = 20;
    let allRaw = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const batch = await listarConversaciones(page);
      allRaw = [...allRaw, ...batch];
      if (batch.length < PAGE_SIZE) break;
    }

    const mapped = allRaw.map((conv) => {
      const sender = conv.meta?.sender ?? {};
      return {
        id: conv.id,
        contactId: sender.id ?? null,
        contactName: sender.name || sender.phone_number || sender.identifier || 'Desconocido',
        phoneNumber: sender.phone_number || sender.identifier || '',
        channel: conv.meta?.channel ?? 'whatsapp',
        lastMessage: conv.last_non_activity_message?.content ?? '',
        lastMessageAt: conv.timestamp ? new Date(conv.timestamp * 1000).toISOString() : '',
        unreadCount: conv.unread_count ?? 0,
        status: conv.status ?? 'open',
      };
    });

    // Deduplicar por número de teléfono: mantener solo la conversación más reciente (mayor id).
    // Los duplicados surgieron antes del fix de derivarAHumano; el fix reutiliza conversaciones
    // abiertas, por lo que nuevos mensajes del cliente se añaden a la más reciente.
    const byPhone = new Map();
    for (const conv of mapped) {
      const key = conv.phoneNumber || conv.contactName;
      const existing = byPhone.get(key);
      if (!existing || conv.id > existing.id) {
        byPhone.set(key, conv);
      }
    }
    const conversaciones = Array.from(byPhone.values())
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    // Reemplazar unreadCount con el contador DynamoDB (portal-nativo).
    // DynamoDB limita BatchGet a 100 claves — chunking obligatorio para inbox grande.
    const conPhone = conversaciones.filter((c) => c.phoneNumber);
    if (conPhone.length > 0) {
      try {
        const BATCH_SIZE = 100;
        const byKey = new Map();

        for (let i = 0; i < conPhone.length; i += BATCH_SIZE) {
          const chunk = conPhone.slice(i, i + BATCH_SIZE);
          const keys = chunk.map((c) => {
            const k = `CONV#${normalizePhone(c.phoneNumber)}`;
            return { pk: k, sk: k };
          });
          const responses = await dynamoDbLib.batchGet({
            RequestItems: { [CONVERSATIONS_TABLE]: { Keys: keys } },
          });
          for (const item of responses[CONVERSATIONS_TABLE] ?? []) byKey.set(item.pk, item);
        }

        // DynamoDB es la fuente de verdad para contadores y último mensaje del portal.
        // Chatwoot no conoce los mensajes manejados por el bot → sus valores son stale.
        for (const conv of conPhone) {
          const sessionItem = byKey.get(`CONV#${normalizePhone(conv.phoneNumber)}`);
          conv.unreadCount = sessionItem?.unreadCount ?? 0;
          if (sessionItem?.lastMessageText) conv.lastMessage = sessionItem.lastMessageText;
          if (sessionItem?.lastMessageAt) conv.lastMessageAt = sessionItem.lastMessageAt;
        }
      } catch (err) {
        // En caso de error del BatchGet, poner 0 en lugar de mostrar el valor de Chatwoot.
        conPhone.forEach((c) => { c.unreadCount = 0; });
        console.warn(`[${ACTION}] BatchGet unreadCount falló (no crítico): ${err.message}`);
      }
    }

    return success(200, conversaciones, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
