const User = require('../models/User');

const requireRole = (...allowed) => (req, res, next) => {
  const role = req.user?.role || 'member';
  if (!allowed.includes(role)) {
    return res.status(403).json({
      error: 'No tienes permisos para esta acción.',
      requiredRoles: allowed,
      yourRole: role,
    });
  }
  next();
};

const isOrganizerOfEvent = async (req, res, next) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId || req.body.eventId);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado.' });
    const uid = req.user._id.toString();
    const isHost =
      event.createdBy?.toString() === uid ||
      event.hosts?.some((h) => h.userId?.toString() === uid);
    const elevated = ['organizer', 'moderator', 'admin'].includes(req.user.role);
    if (!isHost && !elevated) {
      return res.status(403).json({ error: 'Solo el organizador puede gestionar esto.' });
    }
    req.event = event;
    next();
  } catch (e) {
    res.status(500).json({ error: 'Error de autorización.' });
  }
};

module.exports = { requireRole, isOrganizerOfEvent };
