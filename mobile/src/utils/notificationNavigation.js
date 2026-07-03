/**
 * Resuelve el destino de navegación para cada tipo de notificación.
 */
export function normalizeId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
}

export function extractNotificationIds(item) {
  const data = item?.data || {};
  return {
    eventId: normalizeId(data.eventId || data.event?._id || data.event),
    squadId: normalizeId(data.squadId || data.squad?._id || data.squad),
    userId: normalizeId(data.requesterId || data.userId || data.fromUserId),
    postId: normalizeId(data.postId),
    groupId: normalizeId(data.groupId),
    connectionId: normalizeId(data.connectionId),
  };
}

/** Indica si la notificación tiene un destino al tocarla. */
export function isNotificationNavigable(item) {
  return !!resolveNotificationAction(item);
}

/**
 * @returns {{ kind: string, ...params } | null}
 */
export function resolveNotificationAction(item) {
  if (!item) return null;
  const { eventId, squadId, userId, postId } = extractNotificationIds(item);
  const type = item.type;

  switch (type) {
    case 'event_register':
      return eventId
        ? { kind: 'event', eventId, tab: 'ticket' }
        : { kind: 'profile' };

    case 'squad_full':
    case 'squad_invite':
    case 'squad_join':
      if (squadId) return { kind: 'squad', squadId };
      if (eventId) return { kind: 'event', eventId, tab: 'squads' };
      return { kind: 'squads' };

    case 'match_found':
      return eventId
        ? { kind: 'event', eventId, tab: 'groups' }
        : { kind: 'events' };

    case 'wall_reply':
      return eventId
        ? { kind: 'event', eventId, tab: 'wall', postId }
        : null;

    case 'album_pending':
      return eventId
        ? { kind: 'event', eventId, tab: 'album', reviewMode: true }
        : null;

    case 'album_approved':
    case 'album_rejected':
      return eventId
        ? { kind: 'event', eventId, tab: 'album' }
        : null;

    case 'badge_earned':
      return { kind: 'profile' };

    case 'welcome':
      if (userId || item.data?.connectionId) return { kind: 'messages', tab: 'requests' };
      return { kind: 'feed' };

    case 'connection_request':
      return userId
        ? { kind: 'messages', tab: 'requests' }
        : { kind: 'messages', tab: 'requests' };

    default:
      break;
  }

  // Fallback genérico por datos embebidos
  if (squadId) return { kind: 'squad', squadId };
  if (eventId) return { kind: 'event', eventId };
  if (userId) return { kind: 'messages', tab: 'requests' };
  if (type === 'badge_earned') return { kind: 'profile' };
  if (type === 'welcome') return { kind: 'feed' };

  return null;
}
