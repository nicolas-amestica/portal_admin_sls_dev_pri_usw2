import { broadcastToScope, SCOPES } from '../../../libs/websocket.js';
import { mapTurnToPortalMessage } from '../mappers/map-portal-message.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

/**
 * @description Notifica al portal que se agregó un mensaje al historial.
 * @param {{ phone: string, item: object }} params
 */
export async function broadcastMessageAppended({ phone, item }) {
  const normalized = normalizePhone(phone);
  const message = mapTurnToPortalMessage(item);
  await broadcastToScope(
    { phone: normalized },
    { type: 'message_appended', phone: normalized, message, msgSk: item.sk }
  ).catch((err) => console.warn('[Inbox WS] message_appended falló:', err.message));
}

/**
 * @description Actualiza la fila del listado lateral sin refetch HTTP.
 * @param {object} payload
 */
export async function broadcastConversationUpdated(payload) {
  const phone = normalizePhone(payload.phone ?? payload.phoneNumber);
  await broadcastToScope(SCOPES.LIST, {
    type: 'conversation_updated',
    phone,
    ...payload,
  }).catch((err) => console.warn('[Inbox WS] conversation_updated falló:', err.message));
}

/**
 * @description Indica si el agente IA está procesando un mensaje entrante.
 * @param {{ phone: string, active: boolean }} params
 */
export async function broadcastAgentProcessing({ phone, active }) {
  const normalized = normalizePhone(phone);
  await broadcastToScope(
    { phone: normalized },
    { type: 'agent_processing', phone: normalized, active }
  ).catch((err) => console.warn('[Inbox WS] agent_processing falló:', err.message));
}
