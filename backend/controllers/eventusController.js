const Event = require('../models/Event');
const EventWall = require('../models/EventWall');
const MatchGroup = require('../models/MatchGroup');
const CollaborativeAlbum = require('../models/CollaborativeAlbum');
const CommunityType = require('../models/CommunityType');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { generateQRToken } = require('../utils/qrGenerator');

const createEvent = async (req, res) => {
  try {
    const body = req.body;
    const community = await CommunityType.findOne({ slug: body.communitySlug });
    if (!community) return res.status(400).json({ error: 'Tipo de comunidad inválido.' });

    const event = await Event.create({
      metadata: {
        title: body.title,
        description: body.description,
        type: community.name,
        communitySlug: community.slug,
        tags: body.tags || [],
        coverImage: body.coverImage || '',
        impactStatement: body.impactStatement || '',
      },
      impact: body.impact || {},
      schedule: body.schedule,
      location: body.location,
      capacity: body.capacity || { max: 50, current: 0, isLimited: true },
      hosts: [{ userId: req.user._id, role: 'Organizador' }],
      features: { ...body.features },
      creator: { mode: body.creatorMode || 'personal', publishedAt: new Date(), draft: false },
      createdBy: req.user._id,
      isFeatured: false,
    });

    await EventWall.create({ event: event._id });
    if (event.features.albumEnabled !== false) {
      await CollaborativeAlbum.create({
        event: event._id,
        title: `Recuerdos — ${event.metadata.title}`,
        opensAt: event.schedule.date,
      });
    }

    const user = await User.findById(req.user._id);
    user.metrics.eventsCreated += 1;
    user.creatorProfile.isCreator = true;
    user.creatorProfile.eventsPublished += 1;
    await user.save();

    res.status(201).json({ event, message: 'Iniciativa publicada en modo creador.' });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'No se pudo publicar el evento.' });
  }
};

const getEventWall = async (req, res) => {
  try {
    let wall = await EventWall.findOne({ event: req.params.eventId })
      .populate('posts.author', 'profile.firstName profile.lastName profile.avatar');
    if (!wall) {
      wall = await EventWall.create({ event: req.params.eventId });
    }
    res.json({ wall });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo cargar el muro.' });
  }
};

const postToWall = async (req, res) => {
  try {
    const { content, type = 'general' } = req.body;
    const wall = await EventWall.findOneAndUpdate(
      { event: req.params.eventId },
      {
        $push: { posts: { author: req.user._id, content, type } },
        $inc: { 'stats.totalPosts': 1 },
      },
      { new: true, upsert: true }
    ).populate('posts.author', 'profile.firstName profile.lastName profile.avatar');

    await Event.findByIdAndUpdate(req.params.eventId, { $inc: { 'metrics.wallPosts': 1 } });
    const user = await User.findById(req.user._id);
    user.metrics.wallPosts += 1;
    await user.save();

    res.json({ wall, message: 'Publicación agregada al muro.' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo publicar en el muro.' });
  }
};

const getMatchGroups = async (req, res) => {
  try {
    const groups = await MatchGroup.find({ event: req.params.eventId, status: { $ne: 'dissolved' } })
      .populate('members.user', 'profile.firstName profile.lastName profile.avatar profile.interests')
      .populate('createdBy', 'profile.firstName profile.lastName');
    res.json({ groups });
  } catch (error) {
    res.status(500).json({ error: 'No se pudieron cargar grupos.' });
  }
};

const joinMatchmaking = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado.' });

    let openGroup = await MatchGroup.findOne({
      event: event._id,
      status: 'forming',
      $expr: { $lt: [{ $size: '$members' }, '$maxSize'] },
    });

    const memberEntry = { user: req.user._id, status: 'accepted', joinedAt: new Date(), affinityScore: Math.floor(Math.random() * 40) + 60 };

    if (openGroup) {
      const already = openGroup.members.some((m) => m.user.toString() === req.user._id.toString());
      if (already) return res.status(400).json({ error: 'Ya estás en un grupo para este evento.' });
      openGroup.members.push(memberEntry);
      if (openGroup.members.length >= openGroup.maxSize) openGroup.status = 'ready';
      await openGroup.save();
    } else {
      const community = await CommunityType.findOne({ slug: event.metadata.communitySlug });
      const maxSize = community?.matchmaking?.maxGroupSize || 6;
      openGroup = await MatchGroup.create({
        event: event._id,
        name: `Grupo ${event.metadata.title.slice(0, 24)}`,
        communitySlug: event.metadata.communitySlug,
        members: [memberEntry],
        maxSize,
        isAutoMatched: true,
        affinityTags: community?.matchmaking?.affinityTags || [],
      });
      await Event.findByIdAndUpdate(event._id, { $inc: { 'metrics.matchGroupsFormed': 1 } });
    }

    const populated = await MatchGroup.findById(openGroup._id)
      .populate('members.user', 'profile.firstName profile.lastName profile.avatar');

    res.json({ group: populated, message: 'Te uniste al matchmaking. ¡No irás solo!' });
  } catch (error) {
    console.error('Matchmaking error:', error);
    res.status(500).json({ error: 'Matchmaking no disponible.' });
  }
};

const getEventMetrics = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado.' });
    if (event.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Solo el organizador puede ver métricas.' });
    }

    const [wall, groups, album] = await Promise.all([
      EventWall.findOne({ event: event._id }),
      MatchGroup.countDocuments({ event: event._id }),
      CollaborativeAlbum.findOne({ event: event._id }),
    ]);

    res.json({
      metrics: {
        ...event.metrics,
        capacityFill: event.capacity.max ? Math.round((event.capacity.current / event.capacity.max) * 100) : 0,
        wallPosts: wall?.stats?.totalPosts ?? event.metrics.wallPosts,
        matchGroups: groups,
        albumPhotos: album?.stats?.totalPhotos ?? 0,
        impact: event.impact,
      },
      event: { title: event.metadata.title, communitySlug: event.metadata.communitySlug },
    });
  } catch (error) {
    res.status(500).json({ error: 'No se pudieron cargar métricas.' });
  }
};

const getAlbum = async (req, res) => {
  try {
    const album = await CollaborativeAlbum.findOne({ event: req.params.eventId })
      .populate('photos.uploader', 'profile.firstName profile.lastName profile.avatar');
    if (!album) return res.status(404).json({ error: 'Álbum no disponible.' });
    res.json({ album });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo cargar el álbum.' });
  }
};

const addAlbumPhoto = async (req, res) => {
  try {
    const { url, caption } = req.body;
    const album = await CollaborativeAlbum.findOneAndUpdate(
      { event: req.params.eventId, isOpen: true },
      {
        $push: { photos: { uploader: req.user._id, url, caption: caption || '' } },
        $inc: { 'stats.totalPhotos': 1 },
      },
      { new: true, upsert: true }
    );
    await Event.findByIdAndUpdate(req.params.eventId, { $inc: { 'metrics.albumPhotos': 1 } });
    res.json({ album, message: 'Foto agregada al álbum colaborativo.' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo subir la foto.' });
  }
};

const refreshTicketQR = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ user: req.user._id, event: req.params.eventId, status: 'active' });
    if (!ticket) return res.status(404).json({ error: 'No tienes entrada activa.' });

    const nextRotation = ticket.rotationIndex + 1;
    const { token, tokenHash, qrDataUrl, expiresAt, ttlSeconds } = await generateQRToken(
      req.user._id,
      req.params.eventId,
      nextRotation
    );

    ticket.tokenHash = tokenHash;
    ticket.rotationIndex = nextRotation;
    ticket.expiresAt = expiresAt;
    ticket.lastRotatedAt = new Date();
    await ticket.save();

    res.json({ ticket: { qrDataUrl, expiresAt, ttlSeconds, rotationIndex: nextRotation }, token });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo regenerar el QR.' });
  }
};

const getWhatsAppInvite = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado.' });

    await Event.findByIdAndUpdate(event._id, { $inc: { 'metrics.shares': 1 } });
    const user = await User.findById(req.user._id);
    user.metrics.invitesSent += 1;
    await user.save();

    const text = encodeURIComponent(event.sharing.whatsappMessage);
    const waUrl = `https://wa.me/?text=${text}`;

    res.json({
      whatsappUrl: waUrl,
      inviteCode: event.sharing.inviteCode,
      deepLink: event.sharing.deepLink,
      message: event.sharing.whatsappMessage,
    });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo generar enlace.' });
  }
};

const getUserBadgeWall = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId || req.user._id)
      .populate('badges.badge');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ badges: user.badges, impactPoints: user.metrics.impactPoints });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo cargar muro de insignias.' });
  }
};

module.exports = {
  createEvent,
  getEventWall,
  postToWall,
  getMatchGroups,
  joinMatchmaking,
  getEventMetrics,
  getAlbum,
  addAlbumPhoto,
  refreshTicketQR,
  getWhatsAppInvite,
  getUserBadgeWall,
};
