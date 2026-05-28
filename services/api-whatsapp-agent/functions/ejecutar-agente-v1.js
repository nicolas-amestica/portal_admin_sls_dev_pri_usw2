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
import { registerWhatsAppMessageIndex } from '../helpers/whatsapp-delivery.js';
import { sanitizeForHistory } from '../helpers/sanitize-for-history.js';
import { persistInboundMessage } from '../helpers/persist-inbound-message.js';
import {
  broadcastAgentProcessing,
  broadcastConversationUpdated,
  broadcastMessageAppended,
} from '../helpers/inbox-realtime.js';
import { sendMetaTextMessage } from '../helpers/messenger-api.js';
import { getPresignedUrl } from '../../../libs/s3-v3.js';
import { shortenUrl } from '../helpers/url-shortener.js';
import { upsertChatListItem } from '../helpers/chat-list-index.js';

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
 * @description Persiste el turno del modelo (y opcionalmente el user) en DynamoDB.
 * Con skipUserTurn=true el mensaje del cliente ya fue guardado por persistInboundMessage.
 * @param {string} phoneNumber
 * @param {string} userText
 * @param {string} modelText
 * @param {object} collectedData
 * @param {string} [channel]
 * @param {{ whatsappMessageId?: string }} [outboundMeta]
 * @param {{ skipUserTurn?: boolean }} [options]
 */
async function saveConversation(
  phoneNumber,
  userText,
  modelText,
  collectedData,
  channel = 'whatsapp',
  outboundMeta = {},
  options = {}
) {
  const { skipUserTurn = false } = options;
  const { whatsappMessageId: outboundWhatsAppMessageId } = outboundMeta;
  const { CONVERSATIONS_TABLE } = process.env;
  const now = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;
  const normalizedPhone = normalizePhone(phoneNumber);
  const sessionKey = `CONV#${normalizedPhone}`;
  const previewText = (modelText?.trim() ? sanitizeForHistory(modelText) : sanitizeForHistory(userText)).slice(0, 200);
  const lastMessageText = sanitizeForHistory(userText).slice(0, 100);

  const writes = [];

  if (!skipUserTurn) {
    const userItem = buildTurnItem(phoneNumber, `MSG#${uuidv7()}`, 'user', sanitizeForHistory(userText));
    writes.push(dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: userItem }));
  }

  const sessionExprParts = ['collectedData = :cd', 'updatedAt = :now', '#ttl = :ttl'];
  const sessionValues = { ':cd': collectedData, ':now': now, ':ttl': ttl };
  const sessionNames = { '#ttl': 'ttl' };

  if (skipUserTurn) {
    if (modelText?.trim()) {
      sessionExprParts.push('lastMessageAt = :now', 'lastMessageText = :preview');
      sessionValues[':preview'] = sanitizeForHistory(modelText).slice(0, 100);
    }
  } else {
    sessionExprParts.push(
      'lastMessageAt = :now',
      'lastMessageText = :txt',
      'createdAt = if_not_exists(createdAt, :now)',
      'phoneNumber = if_not_exists(phoneNumber, :phone)',
      'channel = if_not_exists(channel, :channel)'
    );
    sessionValues[':txt'] = lastMessageText;
    sessionValues[':phone'] = normalizedPhone;
    sessionValues[':channel'] = channel;
  }

  let sessionUpdate = dynamoDbLib.update({
    TableName: CONVERSATIONS_TABLE,
    Key: { pk: sessionKey, sk: sessionKey },
    UpdateExpression: `SET ${sessionExprParts.join(', ')}${skipUserTurn ? '' : ' ADD unreadCount :one'}`,
    ExpressionAttributeNames: sessionNames,
    ExpressionAttributeValues: skipUserTurn
      ? sessionValues
      : { ...sessionValues, ':one': 1 },
    ReturnValues: 'UPDATED_NEW',
  });

  writes.push(sessionUpdate);

  let modelItem = null;
  let modelSk = null;
  if (modelText?.trim()) {
    modelSk = `MSG#${uuidv7()}`;
    if (outboundWhatsAppMessageId && channel === 'whatsapp') {
      await registerWhatsAppMessageIndex({
        whatsappMessageId: outboundWhatsAppMessageId,
        phone: phoneNumber,
        msgSk: modelSk,
      });
    }
    modelItem = buildTurnItem(
      phoneNumber,
      modelSk,
      'model',
      sanitizeForHistory(modelText),
      [],
      {
        whatsappMessageId: outboundWhatsAppMessageId,
        deliveryStatus: outboundWhatsAppMessageId ? 'sent' : undefined,
      }
    );
    writes.push(dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: modelItem }));
  }

  const results = await Promise.all(writes);
  const sessionResultIdx = skipUserTurn ? 0 : 1;
  const unreadCount = results[sessionResultIdx]?.unreadCount ?? undefined;

  dynamoDbLib
    .update({
      TableName: CONVERSATIONS_TABLE,
      Key: { pk: 'INBOX', sk: `CONV#${normalizedPhone}` },
      UpdateExpression: 'SET lastMessage = :txt, lastMessageAt = :now ADD unreadCount :one',
      ConditionExpression: 'attribute_exists(pk)',
      ExpressionAttributeValues: { ':txt': lastMessageText, ':now': now, ':one': 1 },
    })
    .catch(() => {});

  await upsertChatListItem({
    phone: normalizedPhone,
    channel,
    lastMessage: previewText,
    lastMessageAt: now,
    ...(skipUserTurn ? {} : { unreadDelta: 1 }),
  }).catch((err) => console.warn(`[${ACTION}] No se pudo actualizar CHATS: ${err.message}`));

  const listPayload = {
    phone: normalizedPhone,
    lastMessage: previewText,
    lastMessageAt: now,
    ...(unreadCount != null ? { unreadCount } : {}),
  };

  await Promise.allSettled([
    modelItem ? broadcastMessageAppended({ phone: normalizedPhone, item: modelItem }) : Promise.resolve(),
    broadcastConversationUpdated(listPayload),
  ]).catch((err) => console.warn(`[${ACTION}] Broadcast WS falló (no crítico): ${err.message}`));
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

  const reasonLabel = REASON_LABELS[reason] ?? reason;

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
        reasonLabel,
        lastMessage: (text ?? '').slice(0, 200),
        lastMessageAt: now,
        unreadCount: 1,
        status: 'derived',
        createdAt: now,
        ...(collectedData?.destino && { destino: collectedData.destino }),
        ...(collectedData?.codigoEvento && { codigoEvento: collectedData.codigoEvento }),
        ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
      },
    }),
    dynamoDbLib.update({
      TableName: CONVERSATIONS_TABLE,
      Key: { pk: `CONV#${phone}`, sk: `CONV#${phone}` },
      UpdateExpression: 'SET #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'derived' },
    }),
    upsertChatListItem({
      phone,
      contactName,
      channel,
      lastMessage: (text ?? '').slice(0, 200),
      lastMessageAt: now,
      unreadSet: 1,
      status: 'derived',
      reason,
      reasonLabel,
    }),
  ]);

  await broadcastConversationUpdated({
    phone,
    unreadCount: 1,
    lastMessage: (text ?? '').slice(0, 200),
    lastMessageAt: now,
    status: 'derived',
    reason,
    reasonLabel,
  });

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

  await persistInboundMessage({ phoneNumber, text, messageId, channel });
  await broadcastAgentProcessing({ phone: phoneNumber, active: true });

  try {
    const { session, turnItems } = await loadConversation(phoneNumber);
    const history = toGeminiHistory(turnItems);
    const collectedData = session?.collectedData || {};
    const hasHistory = turnItems.length > 1;

    let responseText;
    let toolsExecuted;
    try {
      ({ responseText, toolsExecuted } = await runConversationTurn(
        history,
        text,
        phoneNumber,
        collectedData,
        channel,
        hasHistory
      ));
      if (toolsExecuted.some((t) => t.name === 'sin_respuesta')) {
        responseText = '';
      }
    } catch (error) {
      console.error(`[${ACTION}] Error en Gemini para ${phoneNumber}:`, error.message, error.stack);
      await Promise.all([
        saveConversation(phoneNumber, text, '', collectedData, channel, {}, { skipUserTurn: true }).catch((e) =>
          console.error(`[${ACTION}] Error guardando turno tras error Gemini:`, e.message)
        ),
        derivarConversacion(phoneNumber, text, 'error_gemini', channel, collectedData).catch((e) => {
          console.error(`[${ACTION}] Error derivando conversación:`, e.message);
        }),
      ]);
      return;
    }

    const derivado = toolsExecuted.some((t) => t.name === 'sin_respuesta');
    const sinPresupuesto = toolsExecuted.some(
      (t) => t.name === 'buscar_presupuestos' && !t.result?.encontrados
    );
    if (derivado || sinPresupuesto) {
      const reason = sinPresupuesto ? 'sin_presupuesto' : 'sin_respuesta';
      const motivoTool = toolsExecuted.find((t) => t.name === 'sin_respuesta')?.args?.motivo || 'N/A';
      const sinBudgetTool = toolsExecuted.find((t) => t.name === 'buscar_presupuestos' && !t.result?.encontrados);
      const extrasSinBudget = sinBudgetTool ? ` Args presupuesto: ${JSON.stringify(sinBudgetTool.args)}` : '';
      console.log(
        `[${ACTION}] Mensaje derivado (${reason}) para ${phoneNumber}. Motivo: ${motivoTool}.${extrasSinBudget} Sin respuesta al cliente.`
      );
      const updatedData = mergeCollectedData(collectedData, toolsExecuted);
      await Promise.all([
        saveConversation(phoneNumber, text, '', updatedData, channel, {}, { skipUserTurn: true }).catch((e) =>
          console.error(`[${ACTION}] Error guardando turno al derivar:`, e.message)
        ),
        derivarConversacion(phoneNumber, text, reason, channel, collectedData).catch((e) => {
          console.error(`[${ACTION}] Error derivando conversación:`, e.message);
        }),
      ]);
      return;
    }

    if (channel === 'whatsapp') {
      await markAsRead(messageId).catch((err) =>
        console.warn(`[${ACTION}] No se pudo marcar como leído:`, err.message)
      );
      await sendTypingIndicator(phoneNumber).catch(() => {});
    }

    if (!responseText?.trim() && toolsExecuted.length > 0) {
      responseText = 'He procesado tu solicitud. En que más puedo ayudarte?';
    }

    await new Promise((resolve) => setTimeout(resolve, calculateTypingDelay(responseText || '')));

    await sendPresupuestoDocuments(channel, phoneNumber, toolsExecuted);
    let outboundText = responseText?.trim() ?? '';
    if (shouldBlockOutboundAgentResponse(outboundText)) {
      console.warn(`[${ACTION}] Texto de respuesta bloqueado (patrón interno). phone=${phoneNumber}`);
      outboundText = '';
    }
    let outboundWhatsAppMessageId = null;
    if (outboundText) {
      if (channel === 'whatsapp') {
        outboundWhatsAppMessageId = await sendTextMessage(phoneNumber, outboundText);
      } else {
        await sendMetaTextMessage(phoneNumber, outboundText);
      }
    } else if (responseText?.trim()) {
      console.warn(`[${ACTION}] No se envió mensaje de texto (vacío o bloqueado). phone=${phoneNumber}`);
    } else {
      console.warn(
        `[${ACTION}] [${phoneNumber}] responseText vacío tras Gemini. Tools: ${toolsExecuted.map((t) => t.name).join(', ')}`
      );
    }

    let updatedData = mergeCollectedData(collectedData, toolsExecuted);
    const pdfListoParaCliente = toolsExecuted.some((t) => t.name === 'buscar_presupuestos' && t.result?.encontrados);
    if (pdfListoParaCliente) {
      updatedData = { ...updatedData, presupuestosPdfEnviados: true };
    }
    await saveConversation(phoneNumber, text, outboundText, updatedData, channel, {
      whatsappMessageId: outboundWhatsAppMessageId ?? undefined,
    }, { skipUserTurn: true });

    console.log(`[${ACTION}] [${channel}] Turno completado para ${phoneNumber}`);
  } finally {
    await broadcastAgentProcessing({ phone: phoneNumber, active: false });
  }
};
