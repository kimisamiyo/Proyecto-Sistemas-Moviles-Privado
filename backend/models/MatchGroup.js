const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['invited', 'accepted', 'declined'], default: 'invited' },
  affinityScore: { type: Number, default: 0 },
  joinedAt: Date,
}, { _id: false });

const MatchGroupSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  communitySlug: { type: String, required: true },
  members: [MemberSchema],
  affinityTags: [String],
  status: {
    type: String,
    enum: ['forming', 'ready', 'confirmed', 'dissolved'],
    default: 'forming',
  },
  maxSize: { type: Number, default: 6 },
  isAutoMatched: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

MatchGroupSchema.index({ event: 1, status: 1 });

module.exports = mongoose.model('MatchGroup', MatchGroupSchema);
