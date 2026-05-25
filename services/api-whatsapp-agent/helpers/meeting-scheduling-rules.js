import Holidays from 'date-holidays';

export const MEETING_DURATION_MINUTES = 90;
export const SLOT_INTERVAL_MINUTES = 90;
export const DAY_START = '10:00';
export const WEEKDAY_CLOSE = '22:00';
export const SATURDAY_CLOSE = '14:00';

const DEFAULT_TIMEZONE = 'America/Santiago';

/** @type {Holidays | null} */
let _chileHolidays = null;

/**
 * @description Instancia lazy de feriados chilenos.
 * @returns {Holidays}
 */
function getChileHolidays() {
  if (!_chileHolidays) {
    _chileHolidays = new Holidays('CL');
  }
  return _chileHolidays;
}

/**
 * @description Convierte HH:MM a minutos desde medianoche.
 * @param {string} time
 * @returns {number}
 */
export function timeToMinutes(time) {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + m;
}

/**
 * @description Convierte minutos desde medianoche a HH:MM.
 * @param {number} minutes
 * @returns {string}
 */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * @description Obtiene el día de la semana (0=dom … 6=sáb) para una fecha en la zona horaria indicada.
 * @param {string} dateStr - YYYY-MM-DD.
 * @param {string} [timeZone]
 * @returns {number}
 */
export function getWeekdayInTimezone(dateStr, timeZone = DEFAULT_TIMEZONE) {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' })
    .format(new Date(`${dateStr}T12:00:00`));
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? 0;
}

/**
 * @description Indica si la fecha es feriado público en Chile.
 * @param {string} dateStr - YYYY-MM-DD.
 * @returns {boolean}
 */
export function isChileanPublicHoliday(dateStr) {
  const holidays = getChileHolidays().isHoliday(new Date(`${dateStr}T12:00:00`));
  return Array.isArray(holidays) && holidays.length > 0;
}

/**
 * @description Suma días a una fecha YYYY-MM-DD.
 * @param {string} dateStr
 * @param {number} dayOffset
 * @returns {string}
 */
function addDaysToDateStr(dateStr, dayOffset) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + dayOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * @description Calcula la fecha/hora de fin del evento según duración estándar de reunión.
 * @param {string} date - YYYY-MM-DD.
 * @param {string} time - HH:MM.
 * @param {number} [durationMinutes]
 * @returns {string} YYYY-MM-DDTHH:MM:00
 */
export function buildEndDateTime(date, time, durationMinutes = MEETING_DURATION_MINUTES) {
  const startMin = timeToMinutes(time);
  const endMin = startMin + durationMinutes;
  let newDate = date;
  let endMinDay = endMin;

  if (endMin >= 24 * 60) {
    endMinDay = endMin - 24 * 60;
    newDate = addDaysToDateStr(date, 1);
  }

  return `${newDate}T${minutesToTime(endMinDay)}:00`;
}

/**
 * @description Devuelve horario permitido y tipo de día para una fecha.
 * @param {string} dateStr
 * @param {string} [timeZone]
 * @returns {{ allowed: boolean, dayType: string, closeTime: string|null, reason?: string }}
 */
export function getDaySchedule(dateStr, timeZone = DEFAULT_TIMEZONE) {
  if (isChileanPublicHoliday(dateStr)) {
    return {
      allowed: false,
      dayType: 'holiday',
      closeTime: null,
      reason: 'No se agendan reuniones en feriados.',
    };
  }

  const weekday = getWeekdayInTimezone(dateStr, timeZone);

  if (weekday === 0) {
    return {
      allowed: false,
      dayType: 'sunday',
      closeTime: null,
      reason: 'No se agendan reuniones los domingos.',
    };
  }

  if (weekday === 6) {
    return { allowed: true, dayType: 'saturday', closeTime: SATURDAY_CLOSE };
  }

  return { allowed: true, dayType: 'weekday', closeTime: WEEKDAY_CLOSE };
}

/**
 * @description Genera bloques de inicio válidos para una fecha (grid de 90 min desde 10:00).
 * @param {string} dateStr
 * @param {string} [timeZone]
 * @returns {string[]}
 */
export function getValidSlotStarts(dateStr, timeZone = DEFAULT_TIMEZONE) {
  const schedule = getDaySchedule(dateStr, timeZone);
  if (!schedule.allowed || !schedule.closeTime) return [];

  const openMin = timeToMinutes(DAY_START);
  const closeMin = timeToMinutes(schedule.closeTime);
  /** @type {string[]} */
  const slots = [];

  for (let start = openMin; start + MEETING_DURATION_MINUTES <= closeMin; start += SLOT_INTERVAL_MINUTES) {
    slots.push(minutesToTime(start));
  }

  return slots;
}

/**
 * @description Verifica si la hora de inicio está alineada al grid de bloques.
 * @param {string} dateStr
 * @param {string} time
 * @param {string} [timeZone]
 * @returns {boolean}
 */
export function isValidSlotStart(dateStr, time, timeZone = DEFAULT_TIMEZONE) {
  return getValidSlotStarts(dateStr, timeZone).includes(time);
}

/**
 * @description Ventana temporal de una reunión en minutos dentro del mismo día.
 * @param {string} date
 * @param {string} time
 * @returns {{ date: string, startMin: number, endMin: number }}
 */
export function meetingWindow(date, time) {
  const startMin = timeToMinutes(time);
  return { date, startMin, endMin: startMin + MEETING_DURATION_MINUTES };
}

/**
 * @description Convierte un evento mapeado del calendario a ventana temporal.
 * @param {{ date: string, startTime: string, endTime?: string }} event
 * @returns {{ date: string, startMin: number, endMin: number }}
 */
export function eventToWindow(event) {
  const startMin = timeToMinutes(event.startTime);
  const endMin = event.endTime
    ? timeToMinutes(event.endTime)
    : startMin + MEETING_DURATION_MINUTES;
  return { date: event.date, startMin, endMin };
}

/**
 * @description True si dos ventanas del mismo día se solapan.
 * @param {{ date: string, startMin: number, endMin: number }} a
 * @param {{ date: string, startMin: number, endMin: number }} b
 * @returns {boolean}
 */
export function windowsOverlap(a, b) {
  if (a.date !== b.date) return false;
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

/**
 * @description True si la ventana propuesta intersecta algún evento existente.
 * @param {{ date: string, startMin: number, endMin: number }} window
 * @param {Array<{ id?: string, date: string, startTime: string, endTime?: string, status?: string }>} events
 * @param {string} [excludeEventId]
 * @returns {boolean}
 */
export function hasOverlapWithEvents(window, events, excludeEventId) {
  for (const ev of events) {
    if (excludeEventId && ev.id === excludeEventId) continue;
    if (ev.status === 'cancelled') continue;
    if (windowsOverlap(window, eventToWindow(ev))) return true;
  }
  return false;
}

/**
 * @description Horarios libres para un día dado.
 * @param {string} dateStr
 * @param {Array<{ id?: string, date: string, startTime: string, endTime?: string, status?: string }>} events
 * @param {string} [excludeEventId]
 * @param {string} [timeZone]
 * @returns {string[]}
 */
export function getAvailableSlots(dateStr, events, excludeEventId, timeZone = DEFAULT_TIMEZONE) {
  const dayEvents = events.filter((e) => e.date === dateStr && e.status !== 'cancelled');
  return getValidSlotStarts(dateStr, timeZone).filter((slot) => {
    const window = meetingWindow(dateStr, slot);
    return !hasOverlapWithEvents(window, dayEvents, excludeEventId);
  });
}

/**
 * @description Itera fechas inclusive entre inicio y fin (YYYY-MM-DD).
 * @param {string} startDate
 * @param {string} endDate
 * @returns {string[]}
 */
export function eachDateInRange(startDate, endDate) {
  /** @type {string[]} */
  const dates = [];
  let current = startDate;

  while (current <= endDate) {
    dates.push(current);
    current = addDaysToDateStr(current, 1);
  }

  return dates;
}

/**
 * @description Valida fecha/hora de reunión contra horario, bloques y solapamientos.
 * @param {object} params
 * @param {string} params.date
 * @param {string} params.time
 * @param {Array<{ id?: string, date: string, startTime: string, endTime?: string, status?: string }>} [params.existingEvents]
 * @param {string} [params.excludeEventId]
 * @param {string} [params.timeZone]
 * @returns {{ valid: boolean, reason?: string, availableSlots?: string[] }}
 */
export function validateMeetingSlot({
  date,
  time,
  existingEvents = [],
  excludeEventId,
  timeZone = process.env.TIMEZONE || DEFAULT_TIMEZONE,
}) {
  const schedule = getDaySchedule(date, timeZone);

  if (!schedule.allowed) {
    return { valid: false, reason: schedule.reason, availableSlots: [] };
  }

  if (!isValidSlotStart(date, time, timeZone)) {
    return {
      valid: false,
      reason: 'La hora no corresponde a un bloque válido de 1 hora 30 minutos.',
      availableSlots: getAvailableSlots(date, existingEvents, excludeEventId, timeZone),
    };
  }

  const window = meetingWindow(date, time);
  if (hasOverlapWithEvents(window, existingEvents, excludeEventId)) {
    return {
      valid: false,
      reason: 'El horario ya está ocupado por otra reunión.',
      availableSlots: getAvailableSlots(date, existingEvents, excludeEventId, timeZone),
    };
  }

  return { valid: true };
}

/**
 * @description Mapa de disponibilidad por día para un rango de fechas.
 * @param {string} fechaInicio
 * @param {string} fechaFin
 * @param {Array<{ id?: string, date: string, startTime: string, endTime?: string, status?: string }>} events
 * @param {string} [timeZone]
 * @returns {Record<string, { diaHabil: boolean, esFestivo: boolean, horariosDisponibles: string[] }>}
 */
export function buildDisponibilidadPorDia(fechaInicio, fechaFin, events, timeZone = DEFAULT_TIMEZONE) {
  /** @type {Record<string, { diaHabil: boolean, esFestivo: boolean, horariosDisponibles: string[] }>} */
  const out = {};

  for (const dateStr of eachDateInRange(fechaInicio, fechaFin)) {
    const schedule = getDaySchedule(dateStr, timeZone);
    const esFestivo = schedule.dayType === 'holiday';
    out[dateStr] = {
      diaHabil: schedule.allowed,
      esFestivo,
      horariosDisponibles: schedule.allowed
        ? getAvailableSlots(dateStr, events, undefined, timeZone)
        : [],
    };
  }

  return out;
}
