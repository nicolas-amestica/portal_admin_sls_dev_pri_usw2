import { toGeminiHistory } from '../mappers/map-conversacion-item.js';

/**
 * @description Separa historial Gemini y texto pendiente del cliente.
 * Incluye todos los mensajes user consecutivos tras la última respuesta del modelo
 * (típico burst de WhatsApp) como un solo newMessage.
 * @param {object[]} turnItems - Items MSG# de DynamoDB en orden cronológico.
 * @returns {{ history: object[], pendingUserText: string, hasHistory: boolean }}
 */
export function prepareTurnContext(turnItems) {
  const msgItems = turnItems.filter(
    (item) => item.sk?.startsWith('MSG#') && item.role !== 'team'
  );

  let lastModelIdx = -1;
  for (let i = msgItems.length - 1; i >= 0; i -= 1) {
    if (msgItems[i].role === 'model') {
      lastModelIdx = i;
      break;
    }
  }

  const historyItems = lastModelIdx >= 0 ? msgItems.slice(0, lastModelIdx + 1) : [];
  const pendingItems = msgItems.slice(lastModelIdx + 1).filter((item) => item.role === 'user');

  const pendingUserText = pendingItems
    .flatMap((item) => item.parts.map((part) => part.text))
    .join('\n')
    .trim();

  const history = toGeminiHistory(historyItems);
  const hasHistory = history.length > 0;

  return { history, pendingUserText, hasHistory };
}

/**
 * @description Textos user relevantes para cotización: turno previo al último model + burst pendiente.
 * @param {object[]} turnItems
 * @returns {string}
 */
export function collectQuoteIntentTexts(turnItems) {
  const msgItems = turnItems.filter(
    (item) => item.sk?.startsWith('MSG#') && item.role !== 'team'
  );

  let lastModelIdx = -1;
  for (let i = msgItems.length - 1; i >= 0; i -= 1) {
    if (msgItems[i].role === 'model') {
      lastModelIdx = i;
      break;
    }
  }

  const texts = [];

  if (lastModelIdx > 0) {
    for (let i = lastModelIdx - 1; i >= 0; i -= 1) {
      if (msgItems[i].role === 'user') {
        msgItems[i].parts.forEach((part) => texts.push(part.text));
        break;
      }
      if (msgItems[i].role === 'model') break;
    }
  }

  msgItems
    .slice(lastModelIdx + 1)
    .filter((item) => item.role === 'user')
    .flatMap((item) => item.parts.map((part) => part.text))
    .forEach((t) => texts.push(t));

  return texts.join('\n').trim();
}
