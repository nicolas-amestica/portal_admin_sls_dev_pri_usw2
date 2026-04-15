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
import { buildSessionItem, buildTurnItem, toGeminiHistory } from '../mappers/map-conversacion-item.js';
import { sendAlertEmail } from '../helpers/alert-email.js';
import { derivarAHumano } from '../helpers/chatwoot-api.js';
import { sendMetaTextMessage } from '../helpers/messenger-api.js';
import { getPresignedUrl } from '../../../libs/s3-v3.js';
import { shortenUrl } from '../helpers/url-shortener.js';

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
  const pk = `CONV#${phoneNumber}`;

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
 * @param {string} phoneNumber
 * @param {string} userText
 * @param {string} modelText
 * @param {object} collectedData
 */
async function saveConversation(phoneNumber, userText, modelText, collectedData) {
  const { CONVERSATIONS_TABLE } = process.env;
  const now = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

  const userItem = buildTurnItem(phoneNumber, `MSG#${uuidv7()}`, 'user', sanitizeForHistory(userText));
  const modelItem = buildTurnItem(phoneNumber, `MSG#${uuidv7()}`, 'model', sanitizeForHistory(modelText));
  const sessionItem = { ...buildSessionItem(phoneNumber, collectedData), updatedAt: now, ttl };

  await Promise.all([
    dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: userItem }),
    dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: modelItem }),
    dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: sessionItem }),
  ]);
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

  // Guardar el código y el ID del evento cuando se crea una reunión.
  const reunionTool = toolsExecuted.find((t) => t.name === 'crear_reunion' && t.result?.codigoEvento);
  if (reunionTool) {
    data.codigoEvento = reunionTool.result.codigoEvento;
    data.eventId = reunionTool.result.eventId;
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

  // 2. Llamar a Gemini con function calling.
  let responseText, toolsExecuted;
  try {
    ({ responseText, toolsExecuted } = await runConversationTurn(history, text, phoneNumber, collectedData, channel));
  } catch (error) {
    console.error(`[${ACTION}] Error en Gemini para ${phoneNumber}:`, error.message, error.stack);
    await Promise.all([
      sendAlertEmail(phoneNumber, text, 'error_gemini', channel, error.message).catch((e) =>
        console.error(`[${ACTION}] Error enviando alerta email:`, e.message)
      ),
      derivarAHumano(phoneNumber, text, 'error_gemini', channel, collectedData).catch((e) =>
        console.error(`[${ACTION}] Error creando conversación en Chatwoot:`, e.message)
      ),
    ]);
    return;
  }

  // 3. Si el agente derivó a humano (sin_respuesta) o no encontró presupuesto, no responder al cliente.
  const derivado = toolsExecuted.some((t) => t.name === 'sin_respuesta');
  const sinPresupuesto = toolsExecuted.some(
    (t) => t.name === 'buscar_presupuestos' && !t.result?.encontrados
  );
  if (derivado || sinPresupuesto) {
    const reason = sinPresupuesto ? 'sin_presupuesto' : 'sin_respuesta';
    console.log(`[${ACTION}] Mensaje derivado (${reason}) para ${phoneNumber}. Sin respuesta al cliente.`);
    await Promise.all([
      sendAlertEmail(phoneNumber, text, reason, channel).catch((e) =>
        console.error(`[${ACTION}] Error enviando alerta email:`, e.message)
      ),
      derivarAHumano(phoneNumber, text, reason, channel, collectedData).catch((e) =>
        console.error(`[${ACTION}] Error creando conversación en Chatwoot:`, e.message)
      ),
    ]);
    return;
  }

  // 4. Marcar como leído y simular escritura (solo disponible en WhatsApp).
  if (channel === 'whatsapp') {
    await markAsRead(messageId).catch((err) =>
      console.warn(`[${ACTION}] No se pudo marcar como leído:`, err.message)
    );
    await sendTypingIndicator(phoneNumber).catch(() => {});
  }
  await new Promise((resolve) => setTimeout(resolve, calculateTypingDelay(responseText)));

  // 5. Enviar documentos PDF y luego el texto de respuesta según el canal.
  await sendPresupuestoDocuments(channel, phoneNumber, toolsExecuted);
  if (channel === 'whatsapp') {
    await sendTextMessage(phoneNumber, responseText);
  } else {
    await sendMetaTextMessage(phoneNumber, responseText);
  }

  // 6. Persistir el turno en DynamoDB.
  const updatedData = mergeCollectedData(collectedData, toolsExecuted);
  await saveConversation(phoneNumber, text, responseText, updatedData);

  console.log(`[${ACTION}] [${channel}] Turno completado para ${phoneNumber}`);
};
