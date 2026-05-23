import { getEventPhase } from './eventSchedule';

export function normalizeWalletItem(raw) {
  if (!raw) return null;
  const ev = raw.eventId;
  const eventId = ev?._id || ev || raw.eventId;
  return {
    eventId: String(eventId),
    ticketId: raw.ticketId?._id || raw.ticketId,
    eventTitle: raw.eventTitle || ev?.metadata?.title || 'Evento',
    coverImage: raw.coverImage || ev?.metadata?.coverImage || '',
    communitySlug: raw.communitySlug || ev?.metadata?.communitySlug,
    venue: raw.venue || ev?.location?.venue,
    date: raw.date || ev?.schedule?.date,
    startTime: raw.startTime || ev?.schedule?.startTime,
    endTime: raw.endTime || ev?.schedule?.endTime,
    schedulePhase:
      raw.schedulePhase ||
      getEventPhase({
        date: raw.date || ev?.schedule?.date,
        startTime: raw.startTime || ev?.schedule?.startTime,
        endTime: raw.endTime || ev?.schedule?.endTime,
      }),
    qrToken: raw.qrToken,
    qrDataUrl: raw.qrDataUrl,
    ttlSeconds: raw.ttlSeconds,
    accessType: raw.accessType || 'Entrada EventUs',
    issuedAt: raw.issuedAt,
  };
}

export function normalizeWallet(list = []) {
  return list.map(normalizeWalletItem).filter(Boolean);
}
