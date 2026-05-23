const Event = require('../models/Event');

const STAFF_ROLES = new Set(['moderator', 'admin']);

const userCanModerateEvent = async (user, eventId) => {
  if (!user || !eventId) return false;
  if (STAFF_ROLES.has(user.role)) return true;

  const event = await Event.findById(eventId).select('createdBy hosts');
  if (!event) return false;

  const uid = user._id.toString();
  if (event.createdBy?.toString() === uid) return true;

  const isHost = event.hosts?.some((h) => h.userId?.toString() === uid);
  if (isHost && ['organizer', 'creator'].includes(user.role)) return true;

  return false;
};

module.exports = { userCanModerateEvent, STAFF_ROLES };
