import * as httpClient from '../../../libs/axios.js';
import { getCalendarAccessToken, buildCalendarApiUrl, mapGoogleEventToMeetEvent } from '../../../helpers/google-calendar-auth.js';
import { mergeAttendeesEnsuringDefaults } from '../../../helpers/meet-default-guest-attendees.js';
import { buildAgentMeetingSharedProperties } from '../../../helpers/meet-default-host-presenter.js';
import { buildEndDateTime, validateMeetingSlot } from '../helpers/meeting-scheduling-rules.js';
import { listarReuniones } from './listar-reuniones.js';

const FLAMINGO_COLOR_ID = '4';
const NOTIFICATIONS = [
  { method: 'popup', minutes: 60 },
  { method: 'popup', minutes: 15 },
];

/**
 * @description Reagenda una reunión existente en Google Calendar a una nueva fecha y hora.
 *
 * @param {object} params
 * @param {string} params.eventId - ID del evento a reagendar.
 * @param {string} params.nuevaFecha - Nueva fecha en formato YYYY-MM-DD.
 * @param {string} params.nuevaHora - Nueva hora en formato HH:MM (America/Santiago).
 * @returns {Promise<{meetLink?: string, eventId?: string, fecha?: string, hora?: string, exito?: boolean, mensaje?: string, horariosDisponibles?: string[]}>}
 */
export async function reagendarReunion({ eventId, nuevaFecha, nuevaHora }) {
  const { GOOGLE_CALENDAR_ID = 'primary', TIMEZONE = 'America/Santiago' } = process.env;

  const { reuniones } = await listarReuniones({ fechaInicio: nuevaFecha, fechaFin: nuevaFecha });
  const slotCheck = validateMeetingSlot({
    date: nuevaFecha,
    time: nuevaHora,
    existingEvents: reuniones,
    excludeEventId: eventId,
  });

  if (!slotCheck.valid) {
    return {
      exito: false,
      mensaje: slotCheck.reason,
      horariosDisponibles: slotCheck.availableSlots ?? [],
    };
  }

  const accessToken = await getCalendarAccessToken();

  const getUrl = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventId);
  let currentEvent;
  try {
    const getResponse = await httpClient.get(getUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    currentEvent = getResponse.data;
  } catch (err) {
    console.error('[REAGENDAR-REUNION] Error al obtener evento:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  const prevExt = currentEvent.extendedProperties && typeof currentEvent.extendedProperties === 'object'
    ? currentEvent.extendedProperties
    : {};

  const updatedBody = {
    ...currentEvent,
    attendees: mergeAttendeesEnsuringDefaults(currentEvent.attendees),
    start: { dateTime: `${nuevaFecha}T${nuevaHora}:00`, timeZone: TIMEZONE },
    end: { dateTime: buildEndDateTime(nuevaFecha, nuevaHora), timeZone: TIMEZONE },
    colorId: FLAMINGO_COLOR_ID,
    reminders: { useDefault: false, overrides: NOTIFICATIONS },
    extendedProperties: {
      ...prevExt,
      shared: buildAgentMeetingSharedProperties(prevExt.shared),
    },
  };

  const putUrl = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventId, { conferenceDataVersion: '1' });

  let updatedEvent;
  try {
    const putResponse = await httpClient.put(putUrl, updatedBody, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    updatedEvent = putResponse.data;
  } catch (err) {
    console.error('[REAGENDAR-REUNION] Error al actualizar evento:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  const mapped = mapGoogleEventToMeetEvent(updatedEvent);
  return {
    meetLink: mapped.googleMeetLink,
    eventId: mapped.id,
    fecha: mapped.date,
    hora: mapped.startTime,
  };
}
