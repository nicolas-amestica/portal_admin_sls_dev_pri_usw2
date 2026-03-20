import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { validateWebhookSignature, extractIncomingMessage } from '../validators/validate-webhook-payload.js';
import { markAsRead } from '../helpers/whatsapp-api.js';

const ACTION = 'Procesar mensaje WhatsApp';

let lambdaClient;
const getLambdaClient = () => {
  if (!lambdaClient) lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
  return lambdaClient;
};

/**
 * @description Recibe notificaciones POST de WhatsApp Cloud API (Meta).
 * Valida la firma HMAC-SHA256, extrae el mensaje de texto entrante,
 * responde 200 OK inmediatamente y delega el procesamiento al agente de forma asíncrona.
 * Meta requiere respuesta en menos de 5 segundos.
 */
export const main = async (event) => {
  const rawBody = event.body || '';
  const signature = event.headers?.['x-hub-signature-256'] || event.headers?.['X-Hub-Signature-256'] || '';

  // Meta siempre envía notificaciones aunque no haya mensajes (status updates, etc.)
  // Responder 200 en todos los casos para evitar reintentos de Meta.
  const ok = { statusCode: 200, body: JSON.stringify({ status: 'ok' }) };

  const isValid = await validateWebhookSignature(rawBody, signature);
  if (!isValid) {
    console.warn(`[${ACTION}] Firma inválida. Ignorando.`);
    return ok;
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return ok;
  }

  const incoming = extractIncomingMessage(body);
  if (!incoming) {
    // Status update, reaction u otro tipo — ignorar silenciosamente.
    return ok;
  }

  const { phoneNumber, messageId, text } = incoming;
  console.log(`[${ACTION}] Mensaje de ${phoneNumber}: "${text.slice(0, 80)}"`);

  // Marcar como leído (doble check azul) — no bloqueante.
  markAsRead(messageId).catch((err) =>
    console.warn(`[${ACTION}] No se pudo marcar como leído:`, err.message)
  );

  // Invocar el agente de forma asíncrona (InvocationType Event = fire-and-forget).
  try {
    await getLambdaClient().send(
      new InvokeCommand({
        FunctionName: process.env.AGENT_LAMBDA_NAME,
        InvocationType: 'Event',
        Payload: Buffer.from(JSON.stringify({ phoneNumber, messageId, text })),
      })
    );
  } catch (err) {
    console.error(`[${ACTION}] Error invocando agente:`, err.message);
  }

  return ok;
};
