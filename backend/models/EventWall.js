const mongoose = require('mongoose');

const WallPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2000 },
  type: {
    type: String,
    enum: ['general', 'logistics', 'icebreaker', 'question', 'announcement'],
    default: 'general',
  },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, default: '👍' },
  }],
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

const EventWallSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  posts: [WallPostSchema],
  stats: {
    totalPosts: { type: Number, default: 0 },
    activeParticipants: { type: Number, default: 0 },
  },
  settings: {
    allowAnonymous: { type: Boolean, default: false },
    moderatorsOnlyPin: { type: Boolean, default: true },
  },
}, { timestamps: true });

EventWallSchema.index({ event: 1 }, { unique: true });

module.exports = mongoose.model('EventWall', EventWallSchema);
