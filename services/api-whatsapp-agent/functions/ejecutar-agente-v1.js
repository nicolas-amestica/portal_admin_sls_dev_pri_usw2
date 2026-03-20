import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { runConversationTurn } from '../helpers/gemini-agent.js';
import { sendTextMessage, sendDocumentMessage } from '../helpers/whatsapp-api.js';
import { buildSessionItem, buildTurnItem, toGeminiHistory } from '../mappers/map-conversacion-item.js';

const ACTION = 'Ejecutar agente WhatsApp';
const MAX_HISTORY_TURNS = 20;

/**
 * @description Carga la sesión y el historial de mensajes de una conversación desde DynamoDB.
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
    Limit: MAX_HISTORY_TURNS + 1,
  });

  if (!items) return { session: null, turnItems: [] };

  const session = items.find((i) => i.sk === pk) || null;
  const turnItems = items.filter((i) => i.sk.startsWith('MSG#')).reverse();

  return { session, turnItems };
}

/**
 * @description Persiste el nuevo turno del usuario y la respuesta del modelo en DynamoDB.
 * También actualiza (o crea) el item de sesión con los datos recopilados.
 *
 * @param {string} phoneNumber
 * @param {string} userText
 * @param {string} modelText
 * @param {object} collectedData - Datos actualizados recopilados por el agente.
 */
async function saveConversation(phoneNumber, userText, modelText, collectedData) {
  const { CONVERSATIONS_TABLE } = process.env;
  const now = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

  const userItem = buildTurnItem(phoneNumber, `MSG#${uuidv7()}`, 'user', userText);
  const modelItem = buildTurnItem(phoneNumber, `MSG#${uuidv7()}`, 'model', modelText);
  const sessionItem = {
    ...buildSessionItem(phoneNumber, collectedData),
    updatedAt: now,
    ttl,
  };

  await Promise.all([
    dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: userItem }),
    dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: modelItem }),
    dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: sessionItem }),
  ]);
}

/**
 * @description Extrae los datos recopilados por Gemini de las herramientas ejecutadas.
 * Si Gemini llamó a buscar_presupuestos, registramos el destino/región/comuna en la sesión.
 *
 * @param {object} existingData - Datos recopilados previamente.
 * @param {Array<{name: string, args: object}>} toolsExecuted
 * @returns {object}
 */
function mergeCollectedData(existingData, toolsExecuted) {
  const data = { ...existingData };
  const presupuestoTool = toolsExecuted.find((t) => t.name === 'buscar_presupuestos');
  if (presupuestoTool) {
    data.destino = presupuestoTool.args.destino;
    data.region = presupuestoTool.args.codigoRegion;
    data.comuna = presupuestoTool.args.nombreComuna;
  }
  return data;
}

/**
 * @description Envía los documentos PDF al cliente por WhatsApp si el agente encontró presupuestos.
 * @param {string} phoneNumber
 * @param {Array<{name: string, args: object, result: object}>} toolsExecuted
 */
async function sendPresupuestoDocuments(phoneNumber, toolsExecuted) {
  const presupuestoTool = toolsExecuted.find((t) => t.name === 'buscar_presupuestos');
  if (!presupuestoTool || !presupuestoTool.result?.encontrados) return;

  const { archivos } = presupuestoTool.result;
  for (const archivo of archivos) {
    await sendDocumentMessage(
      phoneNumber,
      archivo.url,
      archivo.nombre,
      'Presupuesto Giras Indómito'
    );
  }
}

/**
 * @description Orquestador principal del agente de WhatsApp.
 * Recibe el evento de la Lambda asíncrona invocada por procesar-mensaje-v1.js,
 * carga el historial, llama a Gemini con function calling, persiste los turnos
 * y envía la respuesta al cliente por WhatsApp.
 *
 * @param {{ phoneNumber: string, messageId: string, text: string }} event
 */
export const main = async (event) => {
  const { phoneNumber, text } = event;

  if (!phoneNumber || !text) {
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
    const { responseText, toolsExecuted } = await runConversationTurn(history, text, phoneNumber);

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
};
