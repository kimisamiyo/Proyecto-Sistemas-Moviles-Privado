const CommunityType = require('../models/CommunityType');
const Badge = require('../models/Badge');

const listCommunities = async (req, res) => {
  try {
    const communities = await CommunityType.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({ communities });
  } catch (error) {
    console.error('List communities error:', error);
    res.status(500).json({ error: 'No se pudieron cargar las comunidades.' });
  }
};

const getCommunityBySlug = async (req, res) => {
  try {
    const community = await CommunityType.findOne({ slug: req.params.slug });
    if (!community) return res.status(404).json({ error: 'Comunidad no encontrada.' });
    const badges = await Badge.find({ slug: { $in: community.badgeSlugs } });
    res.json({ community, badges });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener comunidad.' });
  }
};

const listBadges = async (req, res) => {
  try {
    const query = req.query.community ? { communitySlugs: req.query.community } : {};
    const badges = await Badge.find(query).sort({ points: -1 });
    res.json({ badges });
  } catch (error) {
    res.status(500).json({ error: 'No se pudieron cargar insignias.' });
  }
};

module.exports = { listCommunities, getCommunityBySlug, listBadges };
