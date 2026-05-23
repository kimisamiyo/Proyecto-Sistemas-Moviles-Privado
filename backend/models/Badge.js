const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'ribbon-outline' },
  imageUrl: { type: String, default: '' },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze',
  },
  points: { type: Number, default: 10 },
  communitySlugs: [{ type: String }],
  criteria: {
    type: { type: String, enum: ['events_attended', 'events_created', 'invites', 'wall_posts', 'check_ins', 'custom'], default: 'custom' },
    threshold: { type: Number, default: 1 },
  },
}, { timestamps: true });

module.exports = mongoose.model('Badge', BadgeSchema);
