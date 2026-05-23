const buildTicketView = ({
  event,
  user,
  ticket,
  qrDataUrl,
  ttlSeconds,
  token,
  walletIssuedAt,
}) => {
  const issuedAt = walletIssuedAt || ticket?.issuedAt || ticket?.createdAt;
  const generatedAt = ticket?.lastRotatedAt || new Date();

  return {
    eventId: event._id,
    ticketId: ticket._id,
    eventTitle: event.metadata?.title || '',
    communitySlug: event.metadata?.communitySlug,
    coverImage: event.metadata?.coverImage || '',
    venue: event.location?.venue || '',
    address: event.location?.address || '',
    date: event.schedule?.date,
    startTime: event.schedule?.startTime,
    endTime: event.schedule?.endTime,
    eventType: event.metadata?.type,
    attendee: {
      id: user._id,
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      fullName: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
      email: user.email,
      title: user.profile?.title || '',
    },
    confirmedAt: issuedAt,
    confirmationStatus: 'confirmed',
    generatedAt,
    lastRefreshedAt: generatedAt,
    qrDataUrl: qrDataUrl || null,
    qrToken: token || null,
    expiresAt: ticket?.expiresAt,
    ttlSeconds: ttlSeconds || 90,
    rotationIndex: ticket?.rotationIndex ?? 0,
    accessType: 'Entrada EventUs',
  };
};

module.exports = { buildTicketView };
