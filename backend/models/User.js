const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserBadgeSchema = new mongoose.Schema({
  badge: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
  slug: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
}, { _id: true });

const WalletItemSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  qrToken: { type: String, default: '' },
  accessType: { type: String, default: 'Entrada general' },
  issuedAt: { type: Date, default: Date.now },
}, { _id: true });

const CredentialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuer: { type: String },
  verified: { type: Boolean, default: false },
  year: { type: Number },
}, { _id: true });

const ROLES = ['member', 'creator', 'organizer', 'moderator', 'admin'];

const UserSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ROLES,
    default: 'member',
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    bio: { type: String, default: '' },
    title: { type: String, default: '' },
    avatar: { type: String, default: '' },
    disciplines: [{ type: String }],
    interests: [{ type: String }],
    communityAffinities: [{ type: String }],
  },
  preferences: {
    favoriteCommunities: [{ type: String }],
    matchmakingOpen: { type: Boolean, default: true },
    notifications: {
      radar: { type: Boolean, default: true },
      matchmaking: { type: Boolean, default: true },
      wallReplies: { type: Boolean, default: true },
    },
  },
  credentials: [CredentialSchema],
  badges: [UserBadgeSchema],
  wallet: [WalletItemSchema],
  metrics: {
    connections: { type: Number, default: 0 },
    eventsAttended: { type: Number, default: 0 },
    eventsCreated: { type: Number, default: 0 },
    impactPoints: { type: Number, default: 0 },
    invitesSent: { type: Number, default: 0 },
    wallPosts: { type: Number, default: 0 },
    checkIns: { type: Number, default: 0 },
    citations: { type: Number, default: 0 },
    contributions: { type: Number, default: 0 },
  },
  creatorProfile: {
    isCreator: { type: Boolean, default: false },
    verifiedOrganizer: { type: Boolean, default: false },
    eventsPublished: { type: Number, default: 0 },
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

UserSchema.index({ location: '2dsphere' });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

UserSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', UserSchema);
