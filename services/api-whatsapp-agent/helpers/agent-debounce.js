import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

/** Ventana de espera tras el último mensaje antes de responder (ms). */
export const AGENT_DEBOUNCE_MS = Number(process.env.AGENT_DEBOUNCE_MS) || 2500;

/**
 * @description Espera el debounce y retorna true solo si esta invocación es la última del burst.
 * Cada mensaje entrante incrementa agentDebounceSeq en la sesión; tras AGENT_DEBOUNCE_MS
 * solo la invocación con el seq más reciente continúa.
 * @param {string} phoneNumber
 * @returns {Promise<boolean>}
 */
export async function waitForAgentDebounce(phoneNumber) {
  const mySeq = await bumpDebounceSeq(phoneNumber);
  await sleep(AGENT_DEBOUNCE_MS);
  const currentSeq = await getDebounceSeq(phoneNumber);
  const isLeader = currentSeq === mySeq;
  if (!isLeader) {
    console.log(
      `[Debounce] Invocación superseded para ${phoneNumber} (seq ${mySeq} < ${currentSeq}). Sin respuesta.`
    );
  }
  return isLeader;
}

/**
 * @description Incrementa atómicamente el contador de debounce de la conversación.
 * @param {string} phoneNumber
 * @returns {Promise<number>}
 */
async function bumpDebounceSeq(phoneNumber) {
  const { CONVERSATIONS_TABLE } = process.env;
  const pk = `CONV#${normalizePhone(phoneNumber)}`;
  const now = new Date().toISOString();

  const updated = await dynamoDbLib.update({
    TableName: CONVERSATIONS_TABLE,
    Key: { pk, sk: pk },
    UpdateExpression:
      'ADD agentDebounceSeq :one SET updatedAt = :now, phoneNumber = if_not_exists(phoneNumber, :phone)',
    ExpressionAttributeValues: {
      ':one': 1,
      ':now': now,
      ':phone': normalizePhone(phoneNumber),
    },
    ReturnValues: 'UPDATED_NEW',
  });

  return Number(updated?.agentDebounceSeq ?? 1);
}

/**
 * @description Lee el contador actual de debounce de la sesión.
 * @param {string} phoneNumber
 * @returns {Promise<number>}
 */
async function getDebounceSeq(phoneNumber) {
  const { CONVERSATIONS_TABLE } = process.env;
  const pk = `CONV#${normalizePhone(phoneNumber)}`;

  const session = await dynamoDbLib.getOne({
    TableName: CONVERSATIONS_TABLE,
    Key: { pk, sk: pk },
  });

  return Number(session?.agentDebounceSeq ?? 0);
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
