const mongoose = require('mongoose');

const RoleRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestedRole: { type: String, enum: ['organizer', 'creator'], required: true },
  reason: { type: String, required: true, maxlength: 500 },
  experience: { type: String, default: '', maxlength: 500 },
  organization: { type: String, default: '', maxlength: 100 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNote: { type: String, default: '' },
}, { timestamps: true });

RoleRequestSchema.index({ user: 1, status: 1 });
RoleRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('RoleRequest', RoleRequestSchema);
