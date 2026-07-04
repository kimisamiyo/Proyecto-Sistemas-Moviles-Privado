const mongoose = require('mongoose');

const HostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['Organizador', 'Co-host', 'Facilitador', 'Voluntario líder'], default: 'Organizador' },
}, { _id: false });

const EventSchema = new mongoose.Schema({
  metadata: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'Voluntariado', 'Benéfico', 'Quedada', 'Reunión', 'Concierto',
        'Deporte', 'Cultura', 'Medio ambiente',
        'Symposium', 'Live Salon', 'Hackathon', 'In-Person Seminar', 'Workshop', 'Lecture',
      ],
      required: true,
    },
    communitySlug: { type: String, required: true },
    tags: [{ type: String }],
    coverImage: { type: String, default: '' },
    impactStatement: { type: String, default: '' },
  },
  impact: {
    category: { type: String, enum: ['social', 'ambiental', 'cultural', 'deportivo', 'educativo', 'otro'], default: 'social' },
    goal: { type: String, default: '' },
    beneficiaries: { type: String, default: '' },
    volunteerHours: { type: Number, default: 0 },
  },
  schedule: {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    timezone: { type: String, default: 'America/Lima' },
  },
  location: {
    venue: { type: String, required: true },
    address: { type: String, default: '' },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
  },
  capacity: {
    max: { type: Number, required: true },
    current: { type: Number, default: 0 },
    isLimited: { type: Boolean, default: true },
  },
  hosts: [HostSchema],
  speakers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, default: 'Guest Speaker' },
  }],
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  features: {
    radarEnabled: { type: Boolean, default: true },
    matchmakingEnabled: { type: Boolean, default: true },
    wallEnabled: { type: Boolean, default: true },
    dynamicQrEnabled: { type: Boolean, default: true },
    albumEnabled: { type: Boolean, default: true },
    whatsappInviteEnabled: { type: Boolean, default: true },
  },
  sharing: {
    inviteCode: { type: String, unique: true, sparse: true },
    deepLink: { type: String, default: '' },
    whatsappMessage: { type: String, default: '' },
  },
  creator: {
    mode: { type: String, enum: ['community', 'personal', 'organization'], default: 'community' },
    publishedAt: Date,
    draft: { type: Boolean, default: false },
  },
  metrics: {
    views: { type: Number, default: 0 },
    registrations: { type: Number, default: 0 },
    checkIns: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    wallPosts: { type: Number, default: 0 },
    matchGroupsFormed: { type: Number, default: 0 },
    albumPhotos: { type: Number, default: 0 },
  },
  isLive: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

EventSchema.index({ 'location.coordinates': '2dsphere' });
EventSchema.index({ 'schedule.date': 1 });
EventSchema.index({ 'metadata.communitySlug': 1 });

EventSchema.pre('save', function generateInvite(next) {
  if (!this.sharing.inviteCode) {
    this.sharing.inviteCode = `EVU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
  if (!this.sharing.deepLink) {
    this.sharing.deepLink = `eventus://event/${this._id || 'new'}`;
  }
  if (!this.sharing.whatsappMessage) {
    const title = this.metadata.title;
    const code = this.sharing.inviteCode;
    const deepLink = this.sharing.deepLink;
    const downloadUrl = 'https://expo.dev/@jesusrazos-team/event-us';
    this.sharing.whatsappMessage =
      `🎉 *${title}*\n\n` +
      `Te invito a este evento en EventUs. ¡No vayas solo!\n\n` +
      `📲 Abre la app: ${deepLink}\n` +
      `🔑 Código: ${code}\n\n` +
      `¿No tienes la app? Descárgala aquí: ${downloadUrl}`;
  }
  next();
});

module.exports = mongoose.model('Event', EventSchema);
