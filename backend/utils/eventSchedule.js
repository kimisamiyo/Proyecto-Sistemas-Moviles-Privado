/**
 * Fases según fecha + startTime/endTime (HH:mm) del evento.
 * - upcoming: aún no empieza
 * - live: en curso ahora
 * - past: ya terminó
 */

function parseTimeParts(timeStr) {
  const [h, m] = String(timeStr || '00:00').split(':').map((n) => parseInt(n, 10) || 0);
  return { h, m };
}

function getEventBounds(schedule) {
  if (!schedule?.date) return null;
  const base = new Date(schedule.date);
  if (Number.isNaN(base.getTime())) return null;

  const { h: sh, m: sm } = parseTimeParts(schedule.startTime);
  const { h: eh, m: em } = parseTimeParts(schedule.endTime || '23:59');

  const start = new Date(base);
  start.setHours(sh, sm, 0, 0);

  const end = new Date(base);
  end.setHours(eh, em, 0, 0);
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
}

function getEventPhase(schedule, now = new Date()) {
  const bounds = getEventBounds(schedule);
  if (!bounds) return 'upcoming';
  if (now < bounds.start) return 'upcoming';
  if (now > bounds.end) return 'past';
  return 'live';
}

function enrichEventSchedule(event, now = new Date()) {
  const obj = event?.toObject ? event.toObject() : { ...event };
  const phase = getEventPhase(obj.schedule, now);
  return {
    ...obj,
    schedulePhase: phase,
    isLive: phase === 'live',
  };
}

function isEventActive(schedule, now = new Date()) {
  const phase = getEventPhase(schedule, now);
  return phase === 'live' || phase === 'upcoming';
}

module.exports = {
  getEventBounds,
  getEventPhase,
  enrichEventSchedule,
  isEventActive,
};
