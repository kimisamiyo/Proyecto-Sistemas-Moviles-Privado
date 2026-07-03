const Badge = require('../models/Badge');
const User = require('../models/User');
const { createNotification } = require('./notificationService');

// Mapea criteria.type de Badge -> campo en user.metrics
const CRITERIA_METRIC_MAP = {
  events_attended: 'eventsAttended',
  events_created: 'eventsCreated',
  invites: 'invitesSent',
  wall_posts: 'wallPosts',
  check_ins: 'checkIns',
};

/**
 * Evalúa el catálogo de insignias contra las métricas del usuario y
 * otorga las que correspondan. Devuelve las insignias nuevas otorgadas.
 * Se llama después de acciones relevantes (inscripción, check-in, post, etc.).
 */
const evaluateBadgesForUser = async (userId, { eventId = null } = {}) => {
  const user = await User.findById(userId);
  if (!user) return [];

  const ownedSlugs = new Set(user.badges.map((b) => b.slug));
  const candidates = await Badge.find({
    'criteria.type': { $in: Object.keys(CRITERIA_METRIC_MAP) },
    slug: { $nin: Array.from(ownedSlugs) },
  });

  const earned = [];
  for (const badge of candidates) {
    const metricKey = CRITERIA_METRIC_MAP[badge.criteria.type];
    const value = user.metrics[metricKey] || 0;
    if (value >= (badge.criteria.threshold || 1)) {
      user.badges.push({ badge: badge._id, slug: badge.slug, earnedAt: new Date(), eventId });
      user.metrics.impactPoints += badge.points || 0;
      earned.push(badge);
    }
  }

  if (earned.length) {
    await user.save();
    await Promise.all(
      earned.map((badge) =>
        createNotification(
          user._id,
          'badge_earned',
          '¡Nueva insignia desbloqueada!',
          `${badge.name} — ${badge.description}`,
          { badgeSlug: badge.slug, eventId }
        ).catch(() => {})
      )
    );
  }

  return earned;
};

/**
 * Otorga una insignia puntual por slug (criterios "custom" disparados por
 * acciones específicas, p.ej. check-in verificado).
 */
const awardBadgeBySlug = async (userId, slug, { eventId = null } = {}) => {
  const user = await User.findById(userId);
  if (!user) return null;
  if (user.badges.some((b) => b.slug === slug)) return null;

  const badge = await Badge.findOne({ slug });
  if (!badge) return null;

  user.badges.push({ badge: badge._id, slug: badge.slug, earnedAt: new Date(), eventId });
  user.metrics.impactPoints += badge.points || 0;
  await user.save();

  createNotification(
    userId,
    'badge_earned',
    '¡Nueva insignia desbloqueada!',
    `${badge.name} — ${badge.description}`,
    { badgeSlug: badge.slug, eventId }
  ).catch(() => {});

  return badge;
};

module.exports = { evaluateBadgesForUser, awardBadgeBySlug };
