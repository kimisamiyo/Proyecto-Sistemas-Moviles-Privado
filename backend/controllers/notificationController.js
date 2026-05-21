const Notification = require('../models/Notification');

const listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unread = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ notifications, unread });
  } catch (error) {
    res.status(500).json({ error: 'No se pudieron cargar notificaciones.' });
  }
};

const markRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, _id: { $in: req.body.ids || [] } },
      { read: true }
    );
    res.json({ message: 'Notificaciones marcadas como leídas.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar.' });
  }
};

module.exports = { listNotifications, markRead };
