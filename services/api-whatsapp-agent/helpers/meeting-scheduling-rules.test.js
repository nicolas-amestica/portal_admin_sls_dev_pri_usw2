import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildDisponibilidadPorDia,
  buildEndDateTime,
  getAvailableSlots,
  getValidSlotStarts,
  isSlotWithinMinAdvance,
  isValidSlotStart,
  validateMeetingSlot,
  hasOverlapWithEvents,
  meetingWindow,
  getDaySchedule,
  zonedDateTimeToUtcMs,
} from './meeting-scheduling-rules.js';

const TEST_DATE = '2026-05-26'; // martes
const TZ = 'America/Santiago';

/** @param {string} time HH:MM en America/Santiago */
function nowAt(dateStr, time) {
  return new Date(zonedDateTimeToUtcMs(dateStr, time, TZ));
}

describe('meeting-scheduling-rules', () => {
  it('genera bloques L-V desde 10:00 cada 90 min hasta 20:30', () => {
    const slots = getValidSlotStarts('2026-05-26'); // martes
    assert.deepEqual(slots, [
      '10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00', '20:30',
    ]);
  });

  it('genera solo 10:00 y 11:30 los sábados', () => {
    const slots = getValidSlotStarts('2026-05-30'); // sábado
    assert.deepEqual(slots, ['10:00', '11:30']);
  });

  it('rechaza domingo', () => {
    const schedule = getDaySchedule('2026-05-31'); // domingo
    assert.equal(schedule.allowed, false);
  });

  it('rechaza feriado chileno (18 de septiembre)', () => {
    const schedule = getDaySchedule('2026-09-18');
    assert.equal(schedule.allowed, false);
    assert.equal(schedule.dayType, 'holiday');
  });

  it('rechaza hora no alineada al grid (11:00)', () => {
    assert.equal(isValidSlotStart('2026-05-26', '11:00'), false);
  });

  it('buildEndDateTime suma 90 min', () => {
    assert.equal(buildEndDateTime('2026-05-26', '20:30'), '2026-05-26T22:00:00');
    assert.equal(buildEndDateTime('2026-05-26', '10:00'), '2026-05-26T11:30:00');
  });

  it('detecta solapamiento: 10:00 ocupado bloquea 11:00 pero no 11:30 (bloque siguiente)', () => {
    const events = [{ id: 'a', date: '2026-05-26', startTime: '10:00', endTime: '11:30' }];
    assert.equal(hasOverlapWithEvents(meetingWindow('2026-05-26', '11:00'), events), true);
    assert.equal(hasOverlapWithEvents(meetingWindow('2026-05-26', '11:30'), events), false);
    assert.equal(hasOverlapWithEvents(meetingWindow('2026-05-26', '13:00'), events), false);
  });

  it('validateMeetingSlot rechaza slot ocupado', () => {
    const events = [{ id: 'a', date: '2026-05-26', startTime: '10:00', endTime: '11:30' }];
    const result = validateMeetingSlot({
      date: '2026-05-26',
      time: '10:00',
      existingEvents: events,
      now: nowAt('2026-05-25', '10:00'),
      timeZone: TZ,
    });
    assert.equal(result.valid, false);
    assert.match(result.reason, /ocupado/);
  });

  it('validateMeetingSlot excluye evento al reagendar', () => {
    const events = [{ id: 'self', date: '2026-05-26', startTime: '10:00', endTime: '11:30' }];
    const result = validateMeetingSlot({
      date: '2026-05-26',
      time: '10:00',
      existingEvents: events,
      excludeEventId: 'self',
      now: nowAt('2026-05-25', '10:00'),
    });
    assert.equal(result.valid, true);
  });

  it('a las 9:00 excluye bloque 10:00 y permite 11:30 en getAvailableSlots', () => {
    const now = nowAt(TEST_DATE, '09:00');
    const slots = getAvailableSlots(TEST_DATE, [], undefined, TZ, now);
    assert.equal(slots.includes('10:00'), false);
    assert.equal(slots.includes('11:30'), true);
  });

  it('a las 9:50 excluye 10:00 y 11:30; permite 13:00', () => {
    const now = nowAt(TEST_DATE, '09:50');
    const slots = getAvailableSlots(TEST_DATE, [], undefined, TZ, now);
    assert.equal(slots.includes('10:00'), false);
    assert.equal(slots.includes('11:30'), false);
    assert.equal(slots.includes('13:00'), true);
  });

  it('validateMeetingSlot rechaza slot dentro de ventana de gracia 2h', () => {
    const now = nowAt(TEST_DATE, '09:50');
    const result = validateMeetingSlot({
      date: TEST_DATE,
      time: '11:30',
      existingEvents: [],
      now,
      timeZone: TZ,
    });
    assert.equal(result.valid, false);
    assert.match(result.reason, /2 horas/);
    assert.equal(result.availableSlots?.includes('13:00'), true);
    assert.equal(result.availableSlots?.includes('11:30'), false);
  });

  it('reagendar respeta ventana de gracia aunque excluya el evento propio', () => {
    const now = nowAt(TEST_DATE, '09:50');
    const events = [{ id: 'self', date: TEST_DATE, startTime: '13:00', endTime: '14:30' }];
    const result = validateMeetingSlot({
      date: TEST_DATE,
      time: '11:30',
      existingEvents: events,
      excludeEventId: 'self',
      now,
      timeZone: TZ,
    });
    assert.equal(result.valid, false);
    assert.match(result.reason, /2 horas/);
  });

  it('buildDisponibilidadPorDia refleja gracia 2h en horariosDisponibles', () => {
    const now = nowAt(TEST_DATE, '09:50');
    const map = buildDisponibilidadPorDia(TEST_DATE, TEST_DATE, [], TZ, now);
    const day = map[TEST_DATE];
    assert.equal(day.diaHabil, true);
    assert.equal(day.horariosDisponibles.includes('10:00'), false);
    assert.equal(day.horariosDisponibles.includes('11:30'), false);
    assert.equal(day.horariosDisponibles.includes('13:00'), true);
  });

  it('isSlotWithinMinAdvance permite bloque exactamente 2h después', () => {
    const now = nowAt(TEST_DATE, '11:00');
    assert.equal(isSlotWithinMinAdvance({ date: TEST_DATE, time: '13:00', now, timeZone: TZ }), true);
    assert.equal(isSlotWithinMinAdvance({ date: TEST_DATE, time: '11:30', now, timeZone: TZ }), false);
  });
});
