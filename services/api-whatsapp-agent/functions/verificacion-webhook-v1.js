import { getSecretManagerValue } from '../../../libs/secret-manager.js';

const ACTION = 'Verificar webhook WhatsApp';

/**
 * @description Verifica el handshake inicial de WhatsApp Cloud API (Meta).
 * Meta hace un GET con hub.mode, hub.verify_token y hub.challenge.
 * Si el verify_token coincide con el almacenado en Secrets Manager, se responde con hub.challenge.
 */
export const main = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const mode = params['hub.mode'];
    const token = params['hub.verify_token'];
    const challenge = params['hub.challenge'];

    if (mode !== 'subscribe' || !token || !challenge) {
      console.warn(`[${ACTION}] Parámetros inválidos:`, { mode, token: !!token, challenge: !!challenge });
      return { statusCode: 400, body: 'Bad Request' };
    }

    const secretJson = await getSecretManagerValue(process.env.WHATSAPP_SECRET_KEY);
    const { verify_token } = JSON.parse(secretJson);

    if (token !== verify_token) {
      console.warn(`[${ACTION}] verify_token no coincide.`);
      return { statusCode: 403, body: 'Forbidden' };
    }

    console.log(`[${ACTION}] Webhook verificado exitosamente.`);
    return { statusCode: 200, body: challenge };
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
