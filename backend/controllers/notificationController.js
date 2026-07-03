const Notification = require('../models/Notification');

const normalizeData = (data) => {
  if (!data || typeof data !== 'object') return {};
  const out = {};
  for (const [key, val] of Object.entries(data)) {
    if (val && (val._bsontype === 'ObjectId' || val.buffer)) {
      out[key] = String(val);
    } else if (val && typeof val === 'object' && val._id && !Array.isArray(val)) {
      out[key] = String(val._id);
    } else {
      out[key] = val;
    }
  }
  return out;
};

const listNotifications = async (req, res) => {
  try {
    const rows = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const notifications = rows.map((n) => ({
      ...n,
      data: normalizeData(n.data),
    }));
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
