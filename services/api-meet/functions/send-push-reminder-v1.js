import { getAllFcmTokens, sendFcmPush } from '../helpers/send-fcm-push.js';

/**
 * Handler Lambda invocado por EventBridge Scheduler para enviar recordatorios push.
 * El payload es el JSON especificado en el Target.Input del schedule.
 *
 * @param {{ eventId: string, title: string, date: string, startTime: string, meetLink: string, minutesBefore: number }} event
 */
export const main = async (event) => {
  const { eventId, title, date, startTime, meetLink, minutesBefore } = event ?? {};

  if (!eventId || !title) {
    console.error('[PUSH-REMINDER] Payload inválido recibido:', JSON.stringify(event));
    return;
  }

  const tokens = await getAllFcmTokens();
  if (!tokens.length) return;

  await sendFcmPush({
    tokens,
    title: `Reunión en ${minutesBefore} min: ${title}`,
    body: `${date} a las ${startTime}`,
    data: {
      meetLink: meetLink ?? '',
      eventId,
      minutesBefore: String(minutesBefore),
    },
  });
};
