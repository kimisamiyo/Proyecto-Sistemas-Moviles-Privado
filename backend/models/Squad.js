const mongoose = require('mongoose');

const SquadMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['leader', 'co-leader', 'member'], default: 'member' },
  status: { type: String, enum: ['active', 'pending', 'declined', 'left'], default: 'active' },
  planNote: { type: String, default: '', maxlength: 200 },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const SquadSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true, maxlength: 80 },
  plan: { type: String, required: true, maxlength: 300 },
  activityTag: { type: String, default: 'general', maxlength: 40 },
  communitySlug: { type: String, required: true },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [SquadMemberSchema],
  maxSize: { type: Number, default: 5, min: 2, max: 100 },
  status: {
    type: String,
    enum: ['recruiting', 'full', 'locked', 'en_route', 'completed', 'cancelled'],
    default: 'recruiting',
  },
  joinPolicy: { type: String, enum: ['open', 'approval'], default: 'open' },
  visibility: { type: String, enum: ['public', 'event_only'], default: 'public' },
  meetingPoint: { type: String, default: '' },
  requirements: {
    description: { type: String, default: '' },
    items: [{ type: String }],
  },
  tags: [{ type: String }],
}, { timestamps: true });

SquadSchema.index({ event: 1, status: 1 });
SquadSchema.index({ status: 1, communitySlug: 1 });
SquadSchema.index({ leader: 1 });

SquadSchema.virtual('activeCount').get(function () {
  return this.members.filter((m) => m.status === 'active').length;
});

SquadSchema.virtual('slotsOpen').get(function () {
  return Math.max(0, this.maxSize - this.activeCount);
});

SquadSchema.methods.syncStatus = function () {
  const count = this.members.filter((m) => m.status === 'active').length;
  if (count >= this.maxSize) this.status = 'full';
  else if (this.status === 'full' && count < this.maxSize) this.status = 'recruiting';
};

SquadSchema.set('toJSON', { virtuals: true });
SquadSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Squad', SquadSchema);
