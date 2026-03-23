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

const ACTION = 'Ejecutar agente WhatsApp';
// Cada turno ocupa 2 items en DynamoDB (user + model). +1 por si el item de sesión aparece.
const MAX_HISTORY_TURNS = 20;
const MAX_HISTORY_ITEMS = MAX_HISTORY_TURNS * 2 + 1;

/**
 * @description Calcula el tiempo de espera simulando escritura humana según el largo del texto.
 * @param {string} text
 * @returns {number} Milisegundos a esperar.
 */
function calculateTypingDelay(text) {
  return Math.min(Math.max(text.length * 40, 1500), 7000);
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

  const userItem = buildTurnItem(phoneNumber, `MSG#${uuidv7()}`, 'user', userText);
  const modelItem = buildTurnItem(phoneNumber, `MSG#${uuidv7()}`, 'model', modelText);
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
 * @description Descarga los PDFs desde S3, los sube a WhatsApp Media API y los envía al cliente.
 * @param {string} phoneNumber
 * @param {Array<{name: string, args: object, result: object}>} toolsExecuted
 */
async function sendPresupuestoDocuments(phoneNumber, toolsExecuted) {
  const presupuestoTool = toolsExecuted.find((t) => t.name === 'buscar_presupuestos');
  if (!presupuestoTool?.result?.encontrados) return;

  for (const archivo of presupuestoTool.result.archivos) {
    const buffer = await getObjectBuffer({ Bucket: process.env.BUCKET_INFO_GI, Key: archivo.key });
    const mediaId = await uploadMedia(buffer, archivo.nombre, 'application/pdf');
    await sendDocumentById(phoneNumber, mediaId, archivo.nombre, 'Presupuesto Giras Indómito');
  }
}

/**
 * @description Orquestador principal del agente de WhatsApp.
 * Recibe el evento de la Lambda asíncrona invocada por procesar-mensaje-v1.js,
 * carga el historial, llama a Gemini con function calling, persiste los turnos
 * y envía la respuesta al cliente por WhatsApp.
 *
 * En caso de error, no envía ninguna respuesta ni marca el mensaje como leído,
 * para que el administrador pueda ver los mensajes sin responder en su bandeja.
 *
 * @param {{ phoneNumber: string, messageId: string, text: string }} event
 */
export const main = async (event) => {
  const { phoneNumber, messageId, type, mediaId } = event;
  let { text } = event;

  if (!phoneNumber || (!text && !mediaId)) {
    console.error(`[${ACTION}] Evento inválido:`, JSON.stringify(event));
    return;
  }

  try {
    console.log(`[${ACTION}] Procesando mensaje de ${phoneNumber}`);

    // 1. Cargar historial de la conversación.
    const { session, turnItems } = await loadConversation(phoneNumber);
    const history = toGeminiHistory(turnItems);
    const collectedData = session?.collectedData || {};

    // 2. Llamar a Gemini con function calling.
    const { responseText, toolsExecuted } = await runConversationTurn(history, text, phoneNumber, collectedData);

    // 3. Enviar documentos PDF si el agente buscó presupuestos.
    await sendPresupuestoDocuments(phoneNumber, toolsExecuted);

    // 4. Enviar la respuesta de texto del agente.
    await sendTextMessage(phoneNumber, responseText);

    // 5. Persistir el turno en DynamoDB.
    const updatedData = mergeCollectedData(collectedData, toolsExecuted);
    await saveConversation(phoneNumber, text, responseText, updatedData);

    console.log(`[${ACTION}] Turno completado para ${phoneNumber}`);
  } catch (error) {
    console.error(`[${ACTION}] Error procesando mensaje de ${phoneNumber}:`, error.message, error.stack);

    // Intentar notificar al cliente del error para no dejarlo sin respuesta.
    try {
      await sendTextMessage(
        phoneNumber,
        'Lo siento, estoy teniendo problemas técnicos en este momento. Por favor intenta nuevamente en unos minutos o contáctanos directamente.'
      );
    } catch (sendErr) {
      console.error(`[${ACTION}] No se pudo enviar mensaje de error al cliente:`, sendErr.message);
    }
  }

  console.log(`[${ACTION}] Procesando mensaje de ${phoneNumber}`);

  const { session, turnItems } = await loadConversation(phoneNumber);
  const history = toGeminiHistory(turnItems);
  const collectedData = session?.collectedData || {};

  const { responseText, toolsExecuted } = await runConversationTurn(history, text, phoneNumber);

  // Si buscar_presupuestos no encontró archivos, dejar el mensaje sin responder ni marcar como
  // leído para que el administrador lo atienda manualmente desde WhatsApp.
  const sinPresupuesto = toolsExecuted.some(
    (t) => t.name === 'buscar_presupuestos' && !t.result?.encontrados
  );
  if (sinPresupuesto) {
    console.log(`[${ACTION}] Sin presupuesto para ${phoneNumber}. Mensaje dejado sin responder.`);
    return;
  }

  // Marcar como leído y mostrar "está escribiendo" antes de responder.
  await markAsRead(messageId).catch((err) =>
    console.warn(`[${ACTION}] No se pudo marcar como leído:`, err.message)
  );
  await sendTypingIndicator(phoneNumber).catch(() => {/* silencioso si no está soportado */});
  await new Promise((resolve) => setTimeout(resolve, calculateTypingDelay(responseText)));

  // Enviar documentos PDF y luego el texto.
  await sendPresupuestoDocuments(phoneNumber, toolsExecuted);
  await sendTextMessage(phoneNumber, responseText);

  // Persistir la conversación.
  const updatedData = mergeCollectedData(collectedData, toolsExecuted);
  await saveConversation(phoneNumber, text, responseText, updatedData);

  console.log(`[${ACTION}] Turno completado para ${phoneNumber}`);
};
