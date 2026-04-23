import { SchedulerClient, CreateScheduleCommand, DeleteScheduleCommand } from '@aws-sdk/client-scheduler';

const scheduler = new SchedulerClient({ region: process.env.AWS_REGION ?? 'us-west-2' });
const TIMEZONE = 'America/Santiago';
const REMINDER_MINUTES = [60, 15];

/** Devuelve el nombre único del schedule para un evento y un tiempo de anticipación. */
function buildScheduleName(eventId, minutesBefore) {
  return `meet-reminder-${eventId}-${minutesBefore}min`;
}

/**
 * Calcula la fecha/hora de disparo del recordatorio restando minutos a la hora de inicio.
 * Retorna una cadena ISO sin timezone: YYYY-MM-DDTHH:MM:00 (se interpreta en TIMEZONE).
 *
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD.
 * @param {string} timeStr - Hora en formato HH:MM.
 * @param {number} minutesBefore - Minutos a restar.
 * @returns {string}
 */
function buildScheduleDatetime(dateStr, timeStr, minutesBefore) {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = h * 60 + m - minutesBefore;
  const pad = (n) => String(n).padStart(2, '0');

  if (totalMins >= 0) {
    return `${dateStr}T${pad(Math.floor(totalMins / 60))}:${pad(totalMins % 60)}:00`;
  }

  // Recordatorio cae en el día anterior
  const adjustedMins = totalMins + 1440;
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return `${d.toISOString().slice(0, 10)}T${pad(Math.floor(adjustedMins / 60))}:${pad(adjustedMins % 60)}:00`;
}

/**
 * Crea dos schedules de EventBridge (60 min y 15 min antes de la reunión).
 *
 * @param {object} params
 * @param {string} params.eventId - ID del evento de Google Calendar.
 * @param {string} params.date - Fecha de la reunión (YYYY-MM-DD).
 * @param {string} params.startTime - Hora de inicio (HH:MM).
 * @param {string} params.title - Título de la reunión.
 * @param {string|null} params.meetLink - Enlace de Google Meet.
 */
export async function createReminders({ eventId, date, startTime, title, meetLink }) {
  const { SEND_PUSH_REMINDER_ARN, SCHEDULER_INVOKE_ROLE_ARN } = process.env;

  for (const minutesBefore of REMINDER_MINUTES) {
    const scheduleAt = buildScheduleDatetime(date, startTime, minutesBefore);
    await scheduler.send(new CreateScheduleCommand({
      Name: buildScheduleName(eventId, minutesBefore),
      ScheduleExpression: `at(${scheduleAt})`,
      ScheduleExpressionTimezone: TIMEZONE,
      FlexibleTimeWindow: { Mode: 'OFF' },
      Target: {
        Arn: SEND_PUSH_REMINDER_ARN,
        RoleArn: SCHEDULER_INVOKE_ROLE_ARN,
        Input: JSON.stringify({ eventId, title, date, startTime, meetLink: meetLink ?? '', minutesBefore }),
      },
    }));
  }
}

/**
 * Elimina los schedules de recordatorio asociados a un evento.
 * Ignora errores de "no encontrado" (el schedule ya fue eliminado o nunca existió).
 *
 * @param {string} eventId - ID del evento de Google Calendar.
 */
export async function deleteReminders(eventId) {
  for (const minutesBefore of REMINDER_MINUTES) {
    try {
      await scheduler.send(new DeleteScheduleCommand({ Name: buildScheduleName(eventId, minutesBefore) }));
    } catch (err) {
      if (err.name !== 'ResourceNotFoundException') throw err;
    }
  }
}
