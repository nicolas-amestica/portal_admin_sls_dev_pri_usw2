/**
 * @description Calcula el TTL de DynamoDB para el historial de mensajes (90 días).
 * @returns {number} Unix timestamp en segundos.
 */
function ttlMessages() {
  return Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;
}

/**
 * @description Normaliza el número de teléfono eliminando el prefijo '+' si lo tiene.
 * Garantiza que todas las claves DynamoDB usen el mismo formato (sin '+').
 * @param {string} phoneNumber
 * @returns {string}
 */
export function normalizePhone(phoneNumber) {
  return phoneNumber?.startsWith('+') ? phoneNumber.slice(1) : (phoneNumber ?? '');
}

/**
 * @description Construye el item de turno de DynamoDB para un mensaje de la conversación.
 * El formato de role y parts es directamente compatible con el historial de Gemini.
 *
 * @param {string} phoneNumber - Número de teléfono.
 * @param {string} sk - Sort key única para este turno (MSG#<uuidv7>).
 * @param {'user'|'model'|'team'} role - Rol del turno.
 * @param {string} text - Texto del mensaje.
 * @param {Array<{url: string, fileName: string, mimeType: string}>} [attachments] - Adjuntos opcionales.
 * @param {{ whatsappMessageId?: string, deliveryStatus?: 'sent'|'delivered'|'read'|'failed' }} [meta] - Metadatos de entrega WhatsApp.
 * @returns {object} Item listo para PutCommand de DynamoDB.
 */
export function buildTurnItem(phoneNumber, sk, role, text, attachments = [], meta = {}) {
  const normalized = normalizePhone(phoneNumber);
  const { whatsappMessageId, deliveryStatus } = meta;
  return {
    pk: `CONV#${normalized}`,
    sk,
    role,
    parts: [{ text }],
    ...(attachments.length ? { attachments } : {}),
    ...(whatsappMessageId ? { whatsappMessageId } : {}),
    ...(deliveryStatus ? { deliveryStatus } : {}),
    createdAt: new Date().toISOString(),
    ttl: ttlMessages(),
  };
}

/**
 * @description Convierte los items de turno de DynamoDB al formato de historial de Gemini.
 * Garantiza que el historial siempre empiece con un turno 'user' (requisito de la API).
 * Excluye mensajes del equipo (role='team') que no son parte del diálogo cliente-agente.
 * Fusiona turnos consecutivos del mismo rol — Gemini rechaza secuencias no alternadas.
 * @param {object[]} items - Items de DynamoDB con campos role y parts.
 * @returns {Array<{role: string, parts: Array<{text: string}>}>}
 */
export function toGeminiHistory(items) {
  const turns = items
    .filter((item) => item.sk.startsWith('MSG#') && item.role !== 'team')
    .map((item) => ({
      role: item.role === 'user' ? 'user' : 'model',
      parts: item.parts,
    }));

  // Gemini rechaza historiales que comiencen con 'model'. Descartamos los turnos
  // iniciales huérfanos si el corte de historial dejó un 'model' al inicio.
  const firstUserIdx = turns.findIndex((t) => t.role === 'user');
  const trimmed = firstUserIdx > 0 ? turns.slice(firstUserIdx) : turns;

  // Fusionar turnos consecutivos del mismo rol para cumplir el requisito de alternancia.
  const merged = trimmed.reduce((acc, turn) => {
    if (acc.length === 0) return [turn];
    const last = acc[acc.length - 1];
    if (last.role === turn.role) {
      return [...acc.slice(0, -1), { role: last.role, parts: [...last.parts, ...turn.parts] }];
    }
    return [...acc, turn];
  }, []);

  // Gemini requiere que el historial termine en 'model'. Un turno 'user' final significa
  // que ese mensaje nunca recibió respuesta (sin_respuesta, error, derivación) y causaría
  // dos user consecutivos al llamar sendMessage. Se descarta para mantener la alternancia.
  if (merged.length > 0 && merged[merged.length - 1].role === 'user') {
    return merged.slice(0, -1);
  }
  return merged;
}
