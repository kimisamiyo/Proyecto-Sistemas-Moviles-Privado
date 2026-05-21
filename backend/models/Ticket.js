const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  tokenHash: { type: String, required: true },
  rotationIndex: { type: Number, default: 0 },
  issuedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  lastRotatedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'used', 'revoked', 'expired'],
    default: 'active',
  },
  checkInAt: Date,
  deviceFingerprint: { type: String, default: '' },
}, { timestamps: true });

TicketSchema.index({ user: 1, event: 1 }, { unique: true });
TicketSchema.index({ tokenHash: 1 });
TicketSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Ticket', TicketSchema);
