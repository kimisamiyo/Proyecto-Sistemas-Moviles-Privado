const STAFF = new Set(['moderator', 'admin']);
const EVENT_CREATORS = new Set(['creator', 'organizer', 'moderator', 'admin']);

export function canCreateEvent(user) {
  if (!user?.role) return false;
  return EVENT_CREATORS.has(user.role);
}

export function canModerateEventAlbum(user, event) {
  if (!user || !event) return false;
  if (STAFF.has(user.role)) return true;

  const uid = String(user._id);
  const createdBy = String(event.createdBy?._id || event.createdBy || '');
  if (createdBy === uid) return true;

  const isHost = event.hosts?.some(
    (h) => String(h.userId?._id || h.userId) === uid
  );
  if (isHost && ['organizer', 'creator'].includes(user.role)) return true;

  return false;
}
