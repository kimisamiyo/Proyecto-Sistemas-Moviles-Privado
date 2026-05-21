const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  caption: { type: String, default: '', maxlength: 300 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const CollaborativeAlbumSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  title: { type: String, default: 'Recuerdos del evento' },
  isOpen: { type: Boolean, default: true },
  opensAt: Date,
  closesAt: Date,
  photos: [PhotoSchema],
  stats: {
    totalPhotos: { type: Number, default: 0 },
    contributors: { type: Number, default: 0 },
  },
}, { timestamps: true });

CollaborativeAlbumSchema.index({ event: 1 }, { unique: true });

module.exports = mongoose.model('CollaborativeAlbum', CollaborativeAlbumSchema);
