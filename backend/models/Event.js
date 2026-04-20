const mongoose = require('mongoose');

const SpeakerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['Keynote', 'Panelist', 'Moderator', 'Guest Speaker'], default: 'Guest Speaker' }
}, { _id: false });

const EventSchema = new mongoose.Schema({
  metadata: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['Symposium', 'Live Salon', 'Hackathon', 'In-Person Seminar', 'Workshop', 'Lecture'],
      required: true
    },
    tags: [{ type: String }],
    coverImage: { type: String, default: '' }
  },
  schedule: {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    timezone: { type: String, default: 'GMT-5' }
  },
  location: {
    venue: { type: String, required: true },
    address: { type: String, default: '' },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  capacity: {
    max: { type: Number, required: true },
    current: { type: Number, default: 0 },
    isLimited: { type: Boolean, default: true }
  },
  speakers: [SpeakerSchema],
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isLive: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

EventSchema.index({ 'location.coordinates': '2dsphere' });
EventSchema.index({ 'schedule.date': 1 });
EventSchema.index({ 'metadata.type': 1 });

module.exports = mongoose.model('Event', EventSchema);
