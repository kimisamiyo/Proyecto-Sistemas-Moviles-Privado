const mongoose = require('mongoose');

const ThemeSchema = new mongoose.Schema({
  primary: String,
  primary_container: String,
  on_primary: String,
  secondary: String,
  accent: String,
  surface: String,
  surface_container_high: String,
  surface_container_highest: String,
  on_surface: String,
  outline: String,
  live: String,
  live_bg: String,
  gradient: [String],
  pattern: String,
  fontAccent: { type: String, default: 'Manrope' },
  bannerImage: { type: String, default: '' },
}, { _id: false });

const MatchmakingConfigSchema = new mongoose.Schema({
  minGroupSize: { type: Number, default: 2 },
  maxGroupSize: { type: Number, default: 8 },
  affinityTags: [String],
}, { _id: false });

const CommunityTypeSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  tagline: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: String, default: 'calendar-outline' },
  mood: [String],
  theme: { type: ThemeSchema, required: true },
  matchmaking: { type: MatchmakingConfigSchema, default: () => ({}) },
  badgeSlugs: [String],
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('CommunityType', CommunityTypeSchema);
