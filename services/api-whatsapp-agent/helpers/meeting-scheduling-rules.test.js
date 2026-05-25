import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildEndDateTime,
  getValidSlotStarts,
  isValidSlotStart,
  validateMeetingSlot,
  hasOverlapWithEvents,
  meetingWindow,
  getDaySchedule,
} from './meeting-scheduling-rules.js';

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
    const result = validateMeetingSlot({ date: '2026-05-26', time: '10:00', existingEvents: events });
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
    });
    assert.equal(result.valid, true);
  });
});
