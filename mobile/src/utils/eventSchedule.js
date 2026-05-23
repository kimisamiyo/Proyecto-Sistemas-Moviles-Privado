function parseTimeParts(timeStr) {
  const [h, m] = String(timeStr || '00:00').split(':').map((n) => parseInt(n, 10) || 0);
  return { h, m };
}

export function getEventBounds(schedule) {
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

/** @returns {'upcoming'|'live'|'past'} */
export function getEventPhase(schedule, now = new Date()) {
  const bounds = getEventBounds(schedule);
  if (!bounds) return 'upcoming';
  if (now < bounds.start) return 'upcoming';
  if (now > bounds.end) return 'past';
  return 'live';
}

export function isEventOnMainFeed(schedule, now = new Date()) {
  const phase = getEventPhase(schedule, now);
  return phase === 'live' || phase === 'upcoming';
}

export function isEventPast(schedule, now = new Date()) {
  return getEventPhase(schedule, now) === 'past';
}

export function enrichEventWithPhase(event, now = new Date()) {
  if (!event) return event;
  const phase = getEventPhase(event.schedule, now);
  return { ...event, schedulePhase: phase, isLive: phase === 'live' };
}
