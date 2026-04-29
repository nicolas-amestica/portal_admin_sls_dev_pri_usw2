import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { getObjectBuffer } from '../../../libs/s3-v3.js';
import { runConversationTurn } from '../helpers/gemini-agent.js';
import { transcribeAudio } from '../helpers/aws-transcribe.js';
import {
  markAsRead,
  sendTypingIndicator,
  uploadMedia,
  sendDocumentById,
  sendTextMessage,
  downloadMedia,
} from '../helpers/whatsapp-api.js';
import { buildTurnItem, toGeminiHistory, normalizePhone } from '../mappers/map-conversacion-item.js';
import { sendMetaTextMessage } from '../helpers/messenger-api.js';
import { getPresignedUrl } from '../../../libs/s3-v3.js';
import { shortenUrl } from '../helpers/url-shortener.js';
import { broadcastToScope, SCOPES } from '../../../libs/websocket.js';

const ACTION = 'Ejecutar agente WhatsApp';
// Cada turno ocupa 2 items en DynamoDB (user + model). +1 por si el item de sesión aparece.
const MAX_HISTORY_TURNS = 20;
const MAX_HISTORY_ITEMS = MAX_HISTORY_TURNS * 2 + 1;
// Límite de caracteres por mensaje para mitigar prompt injection y abuso de contexto.
const MAX_MESSAGE_LENGTH = 800;
// Rate limiting: máximo de mensajes permitidos por ventana de tiempo.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SEC = 60;

/**
 * @description Calcula el tiempo de espera simulando escritura humana según el largo del texto.
 * @param {string} text
 * @returns {number} Milisegundos a esperar.
 */
function calculateTypingDelay(text) {
  return Math.min(Math.max(text.length * 40, 1500), 7000);
}

/**
 * @description Evita enviar al cliente texto que parezca marcador interno de derivación o error del modelo.
 * @param {string} text
 * @returns {boolean}
 */
function shouldBlockOutboundAgentResponse(text) {
  if (!text?.trim()) return false;
  const s = text.trim();
  if (/derivaci[oó]n\s*:/i.test(s)) return true;
  if (/sin_presupuesto\b/i.test(s)) return true;
  if (/sin_respuesta\b/i.test(s)) return true;
  return false;
}

/**
 * @description Verifica si el número de teléfono superó el límite de mensajes por minuto.
 * Usa DynamoDB con TTL para mantener el contador dentro de la ventana de tiempo.
 * @param {string} phoneNumber
 * @returns {Promise<boolean>} true si el mensaje está permitido, false si debe bloquearse.
 */
async function checkRateLimit(phoneNumber) {
  const { CONVERSATIONS_TABLE } = process.env;
  const pk = `RATE#${phoneNumber}`;
  const now = Math.floor(Date.now() / 1000);

  const item = await dynamoDbLib.getOne({
    TableName: CONVERSATIONS_TABLE,
    Key: { pk, sk: pk },
  });

  const windowActive = item && item.ttl > now;
  if (windowActive && item.count >= RATE_LIMIT_MAX) {
    return false;
  }

  const newCount = windowActive ? item.count + 1 : 1;
  const ttl = windowActive ? item.ttl : now + RATE_LIMIT_WINDOW_SEC;

  await dynamoDbLib.put({
    TableName: CONVERSATIONS_TABLE,
    Item: { pk, sk: pk, count: newCount, ttl },
  });

  return true;
}

/**
 * @description Sanitiza el texto del usuario antes de persistirlo en el historial.
 * Elimina patrones que podrían usarse para envenenar el contexto de Gemini en turnos futuros:
 * prefijos de rol, etiquetas de sistema, caracteres de control y null bytes.
 * @param {string} text
 * @returns {string}
 */
function sanitizeForHistory(text) {
  if (!text) return '';
  return text
    .replace(/\0/g, '')                                         // null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')         // caracteres de control
    .replace(/^(system|assistant|user|model)\s*:/gim, '')       // prefijos de rol falsos
    .replace(/<\|.*?\|>/g, '')                                   // tokens especiales estilo <|im_start|>
    .replace(/###\s*(system|instruction|prompt)/gi, '')          // encabezados de instrucción
    .trim();
}

/**
 * @description Carga la sesión y el historial de mensajes desde DynamoDB.
 * @param {string} phoneNumber
 * @returns {Promise<{session: object|null, turnItems: object[]}>}
 */
async function loadConversation(phoneNumber) {
  const { CONVERSATIONS_TABLE } = process.env;
  const pk = `CONV#${normalizePhone(phoneNumber)}`;

  const items = await dynamoDbLib.query({
    TableName: CONVERSATIONS_TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': pk },
    ScanIndexForward: false,
    Limit: MAX_HISTORY_ITEMS,
  });

  if (!items) return { session: null, turnItems: [] };

  const session = items.find((i) => i.sk === pk) || null;
  const turnItems = items.filter((i) => i.sk.startsWith('MSG#')).reverse();

  return { session, turnItems };
}

/**
 * @description Persiste el nuevo turno y la sesión actualizada en DynamoDB.
 * Si la conversación ya fue derivada (item INBOX existe), actualiza también ese item.
 * @param {string} phoneNumber
 * @param {string} userText
 * @param {string} modelText
 * @param {object} collectedData
 */
async function saveConversation(phoneNumber, userText, modelText, collectedData) {
  const { CONVERSATIONS_TABLE } = process.env;
  const now = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const normalizedPhone = normalizePhone(phoneNumber);
  const sessionKey = `CONV#${normalizedPhone}`;
  const lastMessageText = sanitizeForHistory(userText).slice(0, 100);

  const userItem = buildTurnItem(phoneNumber, `MSG#${uuidv7()}`, 'user', sanitizeForHistory(userText));

  // UPDATED_NEW devuelve el unreadCount post-ADD sin una read extra (lo usamos para el broadcast).
  const sessionUpdate = dynamoDbLib.update({
    TableName: CONVERSATIONS_TABLE,
    Key: { pk: sessionKey, sk: sessionKey },
    UpdateExpression: 'SET collectedData = :cd, lastMessageAt = :now, lastMessageText = :txt, updatedAt = :now, #ttl = :ttl, createdAt = if_not_exists(createdAt, :now), phoneNumber = if_not_exists(phoneNumber, :phone) ADD unreadCount :one',
    ExpressionAttributeNames: { '#ttl': 'ttl' },
    ExpressionAttributeValues: { ':cd': collectedData, ':now': now, ':txt': lastMessageText, ':ttl': ttl, ':one': 1, ':phone': normalizedPhone },
    ReturnValues: 'UPDATED_NEW',
  });

  const writes = [dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: userItem }), sessionUpdate];

  // Solo guardar el turno del modelo si hay texto (evita burbujas en blanco en el portal).
  if (modelText?.trim()) {
    const modelItem = buildTurnItem(phoneNumber, `MSG#${uuidv7()}`, 'model', sanitizeForHistory(modelText));
    writes.push(dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: modelItem }));
  }

  const results = await Promise.all(writes);
  const unreadCount = results[1]?.unreadCount ?? 0;

  // Actualizar item INBOX si la conversación ya fue derivada (ConditionExpression evita crear uno nuevo).
  dynamoDbLib.update({
    TableName: CONVERSATIONS_TABLE,
    Key: { pk: 'INBOX', sk: `CONV#${normalizedPhone}` },
    UpdateExpression: 'SET lastMessage = :txt, lastMessageAt = :now ADD unreadCount :one',
    ConditionExpression: 'attribute_exists(pk)',
    ExpressionAttributeValues: { ':txt': lastMessageText, ':now': now, ':one': 1 },
  }).catch(() => {}); // No-op si la conversación no está derivada

  // Notificar a la bandeja (canal LIST) para que los admins vean el badge y el último mensaje
  // sin esperar al polling de fallback. No crítico: si falla el polling recupera el estado.
  await broadcastToScope(SCOPES.LIST, {
    type: 'conversation_updated',
    phoneNumber: normalizedPhone,
    unreadCount,
    lastMessage: lastMessageText,
    lastMessageAt: now,
  }).catch((err) => console.warn(`[${ACTION}] Broadcast WS falló (no crítico): ${err.message}`));
  }

const REASON_LABELS = {
  sin_presupuesto: 'No se encontró presupuesto disponible',
  sin_respuesta: 'Consulta fuera del alcance del agente',
  error_gemini: 'Error en el agente de IA (Gemini)',
};

/**
 * @description Marca la conversación como derivada al equipo humano escribiendo en la partición
 * INBOX de DynamoDB. Reemplaza la creación de conversación en Chatwoot.
 * @param {string} phoneNumber
 * @param {string} text - Último mensaje del cliente.
 * @param {string} reason - Motivo de derivación ('sin_presupuesto' | 'sin_respuesta' | 'error_gemini').
 * @param {string} channel - Canal de origen ('whatsapp' | 'messenger' | 'instagram').
 * @param {object} collectedData - Datos de sesión del cliente.
 * @returns {Promise<string>} phone normalizado.
 */
async function derivarConversacion(phoneNumber, text, reason, channel, collectedData) {
  const { CONVERSATIONS_TABLE } = process.env;
  const phone = normalizePhone(phoneNumber);
  const now = new Date().toISOString();

  // Leer sesión para obtener contactName si ya fue guardado previamente.
  const session = await dynamoDbLib.getOne({
    TableName: CONVERSATIONS_TABLE,
    Key: { pk: `CONV#${phone}`, sk: `CONV#${phone}` },
  }).catch(() => null);

  const contactName = session?.contactName || phone;

  await Promise.all([
    dynamoDbLib.put({
      TableName: CONVERSATIONS_TABLE,
      Item: {
        pk: 'INBOX',
        sk: `CONV#${phone}`,
        phone,
        contactName,
        channel,
        reason,
        reasonLabel: REASON_LABELS[reason] ?? reason,
        lastMessage: (text ?? '').slice(0, 200),
        lastMessageAt: now,
        unreadCount: 1,
        status: 'derived',
        createdAt: now,
        ...(collectedData?.destino && { destino: collectedData.destino }),
        ...(collectedData?.codigoEvento && { codigoEvento: collectedData.codigoEvento }),
        ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
    }),
    dynamoDbLib.update({
      TableName: CONVERSATIONS_TABLE,
      Key: { pk: `CONV#${phone}`, sk: `CONV#${phone}` },
      UpdateExpression: 'SET #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'derived' },
    }),
  ]);

  return phone;
}

/**
 * @description Actualiza los datos recopilados del cliente a partir de las herramientas ejecutadas.
 * @param {object} existingData
 * @param {Array<{name: string, args: object, result: object}>} toolsExecuted
 * @returns {object}
 */
function mergeCollectedData(existingData, toolsExecuted) {
  const data = { ...existingData };

  const presupuestoTool = toolsExecuted.find((t) => t.name === 'buscar_presupuestos');
  if (presupuestoTool) {
    data.destino = presupuestoTool.args.destino;
    data.region = presupuestoTool.args.codigoRegion;
  }

  // Acumular datos parciales de reunión a medida que el cliente los proporciona.
  const guardarTool = toolsExecuted.find((t) => t.name === 'guardar_datos_reunion');
  if (guardarTool) {
    const received = Object.fromEntries(Object.entries(guardarTool.args).filter(([, v]) => v));
    data.pendingMeeting = { ...(data.pendingMeeting || {}), ...received };
  }

  // Guardar el código y el ID del evento cuando se crea una reunión.
  const reunionTool = toolsExecuted.find((t) => t.name === 'crear_reunion' && t.result?.codigoEvento);
  if (reunionTool) {
    data.codigoEvento = reunionTool.result.codigoEvento;
    data.eventId = reunionTool.result.eventId;
    delete data.pendingMeeting;
  }

  // Limpiar el evento si fue cancelado exitosamente.
  const cancelarTool = toolsExecuted.find((t) => t.name === 'cancelar_reunion' && t.result?.exito);
  if (cancelarTool) {
    delete data.codigoEvento;
    delete data.eventId;
  }

  return data;
}

/**
 * @description Envía los presupuestos PDF según el canal del cliente.
 * WhatsApp: sube el archivo y lo envía como documento nativo.
 * Messenger/Instagram: genera URL prefirmada de S3, la acorta y envía como texto.
 * @param {string} channel - Canal de origen ('whatsapp', 'messenger', 'instagram').
 * @param {string} phoneNumber - Número o ID del destinatario.
 * @param {Array<{name: string, args: object, result: object}>} toolsExecuted
 */
async function sendPresupuestoDocuments(channel, phoneNumber, toolsExecuted) {
  const presupuestoTool = toolsExecuted.find((t) => t.name === 'buscar_presupuestos');
  if (!presupuestoTool?.result?.encontrados) return;

  for (const archivo of presupuestoTool.result.archivos) {
    if (channel === 'whatsapp') {
      const buffer = await getObjectBuffer({ Bucket: process.env.BUCKET_INFO_GI, Key: archivo.key });
      const mediaId = await uploadMedia(buffer, archivo.nombre, 'application/pdf');
      await sendDocumentById(phoneNumber, mediaId, archivo.nombre, 'Presupuesto Giras Indómito');
    } else {
      const presignedUrl = await getPresignedUrl(
        { Bucket: process.env.BUCKET_INFO_GI, Key: archivo.key },
        3600
      );
      const url = await shortenUrl(presignedUrl);
      await sendMetaTextMessage(phoneNumber, `${archivo.nombre}: ${url}`);
    }
  }
}

/**
 * @description Orquestador principal del agente multi-canal.
 * Recibe el evento de la Lambda asíncrona invocada por procesar-mensaje-v1.js,
 * carga el historial, llama a Gemini con function calling, persiste los turnos
 * y envía la respuesta al cliente por el canal correspondiente (WhatsApp, Messenger o Instagram).
 *
 * En caso de error, no envía ninguna respuesta ni marca el mensaje como leído,
 * para que el administrador pueda ver los mensajes sin responder en su bandeja.
 *
 * @param {{ channel: 'whatsapp'|'messenger'|'instagram', phoneNumber: string, messageId: string, text: string }} event
 */
export const main = async (event) => {
  const { channel = 'whatsapp', phoneNumber, messageId, type, mediaId } = event;
  let { text } = event;

  if (!phoneNumber || (!text && !mediaId)) {
    console.error(`[${ACTION}] Evento inválido:`, JSON.stringify(event));
    return;
  }

  // Verificar rate limit antes de procesar.
  const allowed = await checkRateLimit(phoneNumber);
  if (!allowed) {
    console.warn(`[${ACTION}] [${channel}] Rate limit excedido para ${phoneNumber}. Mensaje ignorado.`);
    return;
  }

  console.log(`[${ACTION}] [${channel}] Procesando mensaje de ${phoneNumber}`);

  // El audio solo está disponible en WhatsApp.
  if (mediaId && type === 'audio') {
    try {
      const { buffer: audioBuffer, mimeType: audioMimeType } = await downloadMedia(mediaId);
      text = await transcribeAudio(audioBuffer, audioMimeType);
    } catch (err) {
      console.error(`[${ACTION}] Error transcribiendo audio de ${phoneNumber}:`, err.message);
      return;
    }
  }

  // Truncar el mensaje para mitigar prompt injection y abuso de contexto.
  if (text && text.length > MAX_MESSAGE_LENGTH) {
    console.warn(`[${ACTION}] Mensaje de ${phoneNumber} truncado de ${text.length} a ${MAX_MESSAGE_LENGTH} chars.`);
    text = text.slice(0, MAX_MESSAGE_LENGTH);
  }

  // 1. Cargar historial de la conversación.
  const { session, turnItems } = await loadConversation(phoneNumber);
  const history = toGeminiHistory(turnItems);
  const collectedData = session?.collectedData || {};
  // hasHistory: hay mensajes previos en DynamoDB aunque el historial de Gemini quede vacío
  // (ej: todos los turnos fueron sin_respuesta → ningún turno model guardado → trim deja history=[]).
  const hasHistory = turnItems.length > 0;

  // 2. Llamar a Gemini con function calling.
  let responseText, toolsExecuted;
  try {
    ({ responseText, toolsExecuted } = await runConversationTurn(history, text, phoneNumber, collectedData, channel, hasHistory));
    if (toolsExecuted.some((t) => t.name === 'sin_respuesta')) {
      responseText = '';
    }
  } catch (error) {
    console.error(`[${ACTION}] Error en Gemini para ${phoneNumber}:`, error.message, error.stack);
    // Await en paralelo para garantizar que el write en DynamoDB termina antes de retornar
    // (Lambda mata promesas pendientes tras el return → fire-and-forget pierde el UpdateItem).
    const [, phone] = await Promise.all([
      saveConversation(phoneNumber, text, '', collectedData).catch((e) =>
        console.error(`[${ACTION}] Error guardando turno tras error Gemini:`, e.message)
      ),
      derivarConversacion(phoneNumber, text, 'error_gemini', channel, collectedData).catch((e) => {
        console.error(`[${ACTION}] Error derivando conversación:`, e.message);
        return null;
      }),
    ]);
    if (phone) {
      await broadcastToScope({ phone }, { type: 'new_message', phone }).catch((err) =>
        console.warn(`[${ACTION}] Broadcast detalle fallido: ${err.message}`)
      );
    }
    return;
  }

  // 3. Si el agente derivó a humano (sin_respuesta) o no encontró presupuesto, no responder al cliente.
  const derivado = toolsExecuted.some((t) => t.name === 'sin_respuesta');
  const sinPresupuesto = toolsExecuted.some(
    (t) => t.name === 'buscar_presupuestos' && !t.result?.encontrados
  );
  if (derivado || sinPresupuesto) {
    const reason = sinPresupuesto ? 'sin_presupuesto' : 'sin_respuesta';
    const motivoTool = toolsExecuted.find((t) => t.name === 'sin_respuesta')?.args?.motivo || 'N/A';
    const sinBudgetTool = toolsExecuted.find((t) => t.name === 'buscar_presupuestos' && !t.result?.encontrados);
    const extrasSinBudget = sinBudgetTool ? ` Args presupuesto: ${JSON.stringify(sinBudgetTool.args)}` : '';
    console.log(`[${ACTION}] Mensaje derivado (${reason}) para ${phoneNumber}. Motivo: ${motivoTool}.${extrasSinBudget} Sin respuesta al cliente.`);
    const updatedData = mergeCollectedData(collectedData, toolsExecuted);
    // Await en paralelo: sin esto, Lambda puede retornar antes de que el UpdateItem termine.
    const [, phone] = await Promise.all([
      // Solo persistir el mensaje del usuario; no crear burbuja del modelo con marcadores internos.
      saveConversation(phoneNumber, text, '', updatedData).catch((e) =>
        console.error(`[${ACTION}] Error guardando turno al derivar:`, e.message)
      ),
      derivarConversacion(phoneNumber, text, reason, channel, collectedData).catch((e) => {
        console.error(`[${ACTION}] Error derivando conversación:`, e.message);
        return null;
      }),
    ]);
    if (phone) {
      await broadcastToScope({ phone }, { type: 'new_message', phone }).catch((err) =>
        console.warn(`[${ACTION}] Broadcast detalle fallido: ${err.message}`)
      );
    }
    return;
  }

  // 4. Marcar como leído y simular escritura (solo disponible en WhatsApp).
  if (channel === 'whatsapp') {
    await markAsRead(messageId).catch((err) =>
      console.warn(`[${ACTION}] No se pudo marcar como leído:`, err.message)
    );
    await sendTypingIndicator(phoneNumber).catch(() => {});
  }

  // Fallback: Si Gemini no devolvió texto pero ejecutó herramientas, forzar un mensaje informativo.
  if (!responseText?.trim() && toolsExecuted.length > 0) {
    responseText = 'He procesado tu solicitud. En que más puedo ayudarte?';
  }

  await new Promise((resolve) => setTimeout(resolve, calculateTypingDelay(responseText || '')));

  // 5. Enviar documentos PDF y luego el texto de respuesta según el canal.
  await sendPresupuestoDocuments(channel, phoneNumber, toolsExecuted);
  let outboundText = responseText?.trim() ?? '';
  if (shouldBlockOutboundAgentResponse(outboundText)) {
    console.warn(`[${ACTION}] Texto de respuesta bloqueado (patrón interno). phone=${phoneNumber}`);
    outboundText = '';
  }
  if (outboundText) {
    if (channel === 'whatsapp') {
      await sendTextMessage(phoneNumber, outboundText);
    } else {
      await sendMetaTextMessage(phoneNumber, outboundText);
    }
  } else if (responseText?.trim()) {
    console.warn(`[${ACTION}] No se envió mensaje de texto (vacío o bloqueado). phone=${phoneNumber}`);
  } else {
    console.warn(`[${ACTION}] [${phoneNumber}] responseText vacío tras Gemini. Tools: ${toolsExecuted.map(t => t.name).join(', ')}`);
  }

  // 6. Persistir el turno en DynamoDB (solo texto ya saneado; nunca marcadores internos).
  let updatedData = mergeCollectedData(collectedData, toolsExecuted);
  const pdfListoParaCliente = toolsExecuted.some((t) => t.name === 'buscar_presupuestos' && t.result?.encontrados);
  if (pdfListoParaCliente) {
    updatedData = { ...updatedData, presupuestosPdfEnviados: true };
  }
  await saveConversation(phoneNumber, text, outboundText, updatedData);

  console.log(`[${ACTION}] [${channel}] Turno completado para ${phoneNumber}`);
};
