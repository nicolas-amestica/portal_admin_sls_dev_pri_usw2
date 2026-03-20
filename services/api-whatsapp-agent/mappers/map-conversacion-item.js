/**
 * @description Calcula el TTL de DynamoDB para 7 días desde ahora.
 * @returns {number} Unix timestamp en segundos.
 */
function ttl7Days() {
  return Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
}

/**
 * @description Construye el item de sesión de DynamoDB para una conversación.
 * Almacena el estado actual y los datos recopilados por el agente (destino, región, comuna).
 *
 * @param {string} phoneNumber - Número de teléfono con código de país (ej: +56912345678).
 * @param {object} [collectedData] - Datos recopilados hasta ahora en la conversación.
 * @returns {object} Item listo para PutCommand de DynamoDB.
 */
export function buildSessionItem(phoneNumber, collectedData = {}) {
  const now = new Date().toISOString();
  return {
    pk: `CONV#${phoneNumber}`,
    sk: `CONV#${phoneNumber}`,
    phoneNumber,
    collectedData,
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
    ttl: ttl7Days(),
  };
}

/**
 * @description Construye el item de turno de DynamoDB para un mensaje de la conversación.
 * El formato de role y parts es directamente compatible con el historial de Gemini.
 *
 * @param {string} phoneNumber - Número de teléfono.
 * @param {string} sk - Sort key única para este turno (MSG#<uuidv7>).
 * @param {'user'|'model'} role - Rol del turno.
 * @param {string} text - Texto del mensaje.
 * @returns {object} Item listo para PutCommand de DynamoDB.
 */
export function buildTurnItem(phoneNumber, sk, role, text) {
  return {
    pk: `CONV#${phoneNumber}`,
    sk,
    role,
    parts: [{ text }],
    createdAt: new Date().toISOString(),
    ttl: ttl7Days(),
  };
}

/**
 * @description Convierte los items de turno de DynamoDB al formato de historial de Gemini.
 * @param {object[]} items - Items de DynamoDB con campos role y parts.
 * @returns {Array<{role: string, parts: Array<{text: string}>}>}
 */
export function toGeminiHistory(items) {
  return items
    .filter((item) => item.sk.startsWith('MSG#'))
    .map((item) => ({ role: item.role, parts: item.parts }));
}
