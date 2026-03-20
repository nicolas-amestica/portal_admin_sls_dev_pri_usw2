import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { validateWebhookSignature, extractIncomingMessage } from '../validators/validate-webhook-payload.js';

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
 * El mensaje NO se marca como leído aquí; el agente lo hace solo tras procesar exitosamente.
 */
export const main = async (event) => {
  const rawBody = event.body || '';
  const signature = event.headers?.['x-hub-signature-256'] || event.headers?.['X-Hub-Signature-256'] || '';

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
  if (!incoming) return ok;

  const { phoneNumber, messageId, text, type, mediaId } = incoming;
  console.log(`[${ACTION}] Mensaje de ${phoneNumber}: tipo=${type ?? 'text'} "${(text ?? mediaId ?? '').slice(0, 80)}"`);

  try {
    await getLambdaClient().send(
      new InvokeCommand({
        FunctionName: process.env.AGENT_LAMBDA_NAME,
        InvocationType: 'Event',
        Payload: Buffer.from(JSON.stringify({ phoneNumber, messageId, text, type, mediaId })),
      })
    );
  } catch (err) {
    console.error(`[${ACTION}] Error invocando agente:`, err.message);
  }

  return ok;
};
