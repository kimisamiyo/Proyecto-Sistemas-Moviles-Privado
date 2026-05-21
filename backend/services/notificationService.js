const Notification = require('../models/Notification');

const createNotification = async (userId, type, title, body, data = {}) => {
  return Notification.create({ user: userId, type, title, body, data });
};

const notifySquadUpdate = async (squad, event, message) => {
  const active = squad.members.filter((m) => m.status === 'active');
  return Promise.all(
    active.map((m) =>
      createNotification(m.user, 'squad_join', `Escuadra: ${squad.name}`, message, {
        squadId: squad._id,
        eventId: event._id,
        slotsOpen: squad.maxSize - active.length,
      })
    )
  );
};

module.exports = { createNotification, notifySquadUpdate };
