const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'welcome', 'event_register', 'squad_join', 'squad_full', 'squad_invite',
      'match_found', 'wall_reply', 'badge_earned', 'email_sent',
    ],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
}, { timestamps: true });

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
