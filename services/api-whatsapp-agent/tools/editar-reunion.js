import axios from 'axios';
import { getCalendarAccessToken, buildCalendarApiUrl, mapGoogleEventToMeetEvent } from '../../../helpers/google-calendar-auth.js';
import { mergeAttendeesEnsuringDefaults } from '../../../helpers/meet-default-guest-attendees.js';
import { buildAgentMeetingSharedProperties } from '../../../helpers/meet-default-host-presenter.js';
import { buildEndDateTime, validateMeetingSlot } from '../helpers/meeting-scheduling-rules.js';
import { buscarEventosPorTelefono } from './crear-reunion.js';
import { listarReuniones } from './listar-reuniones.js';

const TIMEZONE = 'America/Santiago';

/**
 * @description Busca en el calendario el evento del cliente usando su código único.
 * @param {string} calendarId
 * @param {string} codigoEvento
 * @param {string} accessToken
 * @returns {Promise<object|null>} Evento de Google Calendar o null si no se encuentra.
 */
async function buscarEventoPorCodigo(calendarId, codigoEvento, accessToken) {
  const url = buildCalendarApiUrl(calendarId, null, {
    q: `[${codigoEvento}]`,
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const items = response.data.items || [];
  const pattern = `[${codigoEvento}]`;
  return items.find((e) => (e.summary || '').includes(pattern)) || null;
}

/**
 * @description Reagenda la reunión del cliente.
 * Orden de búsqueda: eventId directo → codigoEvento en título → teléfono (fallback para sesiones stale).
 *
 * @param {object} params
 * @param {string} [params.codigoEvento] - Código único del evento (sesión).
 * @param {string} [params.eventId] - ID directo del evento en Google Calendar (preferido).
 * @param {string} params.nuevaFecha - Nueva fecha en formato YYYY-MM-DD.
 * @param {string} params.nuevaHora - Nueva hora de inicio en formato HH:MM (America/Santiago).
 * @param {string} [params.emailCliente] - Email del cliente para enviarle la invitación actualizada.
 * @param {string} [params.phoneNumber] - Teléfono normalizado sin '+'. Fallback cuando sesión no tiene codigoEvento.
 * @returns {Promise<{exito: boolean, fecha?: string, hora?: string, meetLink?: string|null, mensaje: string, horariosDisponibles?: string[]}>}
 */
export async function editarReunion({ codigoEvento, eventId, nuevaFecha, nuevaHora, emailCliente, phoneNumber }) {
  const { GOOGLE_CALENDAR_ID = 'primary' } = process.env;

  if (!codigoEvento && !eventId && !phoneNumber) {
    return { exito: false, mensaje: 'No tienes una reunión agendada para reagendar.' };
  }

  const accessToken = await getCalendarAccessToken();

  let eventoExistente = null;

  if (eventId) {
    try {
      const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventId);
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      eventoExistente = response.data;
    } catch (err) {
      console.error('[EDITAR-REUNION] Error obteniendo evento por ID:', JSON.stringify(err.response?.data ?? err.message));
    }
  }

  if (!eventoExistente && codigoEvento) {
    try {
      eventoExistente = await buscarEventoPorCodigo(GOOGLE_CALENDAR_ID, codigoEvento, accessToken);
    } catch (err) {
      console.error('[EDITAR-REUNION] Error buscando por código:', JSON.stringify(err.response?.data ?? err.message));
    }
  }

  if (!eventoExistente && phoneNumber) {
    const events = await buscarEventosPorTelefono(GOOGLE_CALENDAR_ID, phoneNumber, accessToken).catch(() => []);
    eventoExistente = events[0] || null;
  }

  if (!eventoExistente || eventoExistente.status === 'cancelled') {
    return { exito: false, mensaje: 'No se encontró tu reunión. Es posible que ya haya sido cancelada.' };
  }

  const { reuniones } = await listarReuniones({ fechaInicio: nuevaFecha, fechaFin: nuevaFecha });
  const slotCheck = validateMeetingSlot({
    date: nuevaFecha,
    time: nuevaHora,
    existingEvents: reuniones,
    excludeEventId: eventoExistente.id,
  });

  if (!slotCheck.valid) {
    return {
      exito: false,
      mensaje: slotCheck.reason,
      horariosDisponibles: slotCheck.availableSlots ?? [],
    };
  }

  const tz = eventoExistente.start?.timeZone || TIMEZONE;
  const attendees = mergeAttendeesEnsuringDefaults(eventoExistente.attendees, emailCliente);
  const prevExt = eventoExistente.extendedProperties && typeof eventoExistente.extendedProperties === 'object'
    ? eventoExistente.extendedProperties
    : {};
  const prevPrivate = prevExt.private && typeof prevExt.private === 'object' ? prevExt.private : {};

  const updatedBody = {
    ...eventoExistente,
    start: { dateTime: `${nuevaFecha}T${nuevaHora}:00`, timeZone: tz },
    end: { dateTime: buildEndDateTime(nuevaFecha, nuevaHora), timeZone: tz },
    attendees,
    extendedProperties: {
      ...prevExt,
      private: {
        ...prevPrivate,
        ...(phoneNumber && { phoneNumber }),
      },
      shared: buildAgentMeetingSharedProperties(prevExt.shared, phoneNumber),
    },
  };

  let updatedEvent;
  try {
    const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventoExistente.id, { sendUpdates: 'all' });
    const response = await axios.put(url, updatedBody, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    updatedEvent = response.data;
  } catch (err) {
    console.error('[EDITAR-REUNION] Error actualizando evento:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  const mapped = mapGoogleEventToMeetEvent(updatedEvent);

  return {
    exito: true,
    fecha: mapped.date,
    hora: mapped.startTime,
    meetLink: mapped.googleMeetLink,
    mensaje: 'Reunión reagendada correctamente.',
  };
}
