const Event = require('../models/Event');
const EventWall = require('../models/EventWall');
const MatchGroup = require('../models/MatchGroup');
const CollaborativeAlbum = require('../models/CollaborativeAlbum');
const CommunityType = require('../models/CommunityType');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { generateQRToken } = require('../utils/qrGenerator');
const { pickCover } = require('../config/demoImages');
const { userCanModerateEvent } = require('../utils/albumPermissions');
const { createNotification } = require('../services/notificationService');
const { buildTicketView } = require('../utils/ticketPayload');

const createEvent = async (req, res) => {
  try {
    const body = req.body;
    const community = await CommunityType.findOne({ slug: body.communitySlug });
    if (!community) return res.status(400).json({ error: 'Tipo de comunidad inválido.' });

    const coverSeed = body.title?.length ? body.title : community.slug;
    const event = await Event.create({
      metadata: {
        title: body.title,
        description: body.description,
        type: community.name,
        communitySlug: community.slug,
        tags: body.tags || [],
        coverImage: body.coverImage || pickCover(coverSeed.length % 12),
        impactStatement: body.impactStatement || '',
      },
      impact: body.impact || {},
      schedule: body.schedule,
      location: {
        venue: body.location.venue,
        address: body.location.address || body.location.venue,
        coordinates: body.location.coordinates,
      },
      capacity: {
        max: body.capacity?.max || 50,
        current: 0,
        isLimited: body.capacity?.isLimited !== false,
      },
      hosts: [{ userId: req.user._id, role: 'Organizador' }],
      features: {
        radarEnabled: true,
        matchmakingEnabled: body.features?.matchmakingEnabled !== false,
        wallEnabled: body.features?.wallEnabled !== false,
        dynamicQrEnabled: true,
        albumEnabled: body.features?.albumEnabled !== false,
        whatsappInviteEnabled: true,
      },
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

const formatAlbumResponse = (album, user, canModerate) => {
  const uid = user._id.toString();
  const all = album.photos || [];
  const approved = all.filter((p) => p.status === 'approved');
  const pending = all.filter((p) => p.status === 'pending');
  const myPending = pending.filter((p) => (p.uploader?._id || p.uploader)?.toString() === uid);

  return {
    album: {
      ...album.toObject(),
      photos: canModerate ? all : approved,
    },
    canModerate,
    pendingCount: pending.length,
    myPendingCount: myPending.length,
    moderationQueue: canModerate ? pending : [],
  };
};

const getAlbum = async (req, res) => {
  try {
    const album = await CollaborativeAlbum.findOne({ event: req.params.eventId })
      .populate('photos.uploader', 'profile.firstName profile.lastName profile.avatar')
      .populate('photos.reviewedBy', 'profile.firstName profile.lastName');
    if (!album) return res.status(404).json({ error: 'Álbum no disponible.' });

    const canModerate = await userCanModerateEvent(req.user, req.params.eventId);
    res.json(formatAlbumResponse(album, req.user, canModerate));
  } catch (error) {
    res.status(500).json({ error: 'No se pudo cargar el álbum.' });
  }
};

const addAlbumPhoto = async (req, res) => {
  try {
    const { url, caption } = req.body;
    if (!url?.trim()) {
      return res.status(400).json({ error: 'URL de imagen requerida.' });
    }

    let album = await CollaborativeAlbum.findOne({ event: req.params.eventId });
    if (!album) {
      album = await CollaborativeAlbum.create({
        event: req.params.eventId,
        title: 'Recuerdos del evento',
      });
    }
    if (!album.isOpen) {
      return res.status(400).json({ error: 'El álbum no acepta más fotos.' });
    }

    album.photos.push({
      uploader: req.user._id,
      url: url.trim(),
      caption: (caption || '').trim(),
      status: 'pending',
    });
    album.stats.pendingPhotos = (album.stats.pendingPhotos || 0) + 1;
    await album.save();

    const event = await Event.findById(req.params.eventId).select('metadata.title createdBy');
    const moderators = await User.find({
      $or: [
        { role: { $in: ['moderator', 'admin'] } },
        { _id: event.createdBy },
      ],
    }).select('_id');

    await Promise.all(
      moderators.map((m) =>
        createNotification(
          m._id,
          'album_pending',
          'Foto en revisión',
          `Nueva foto pendiente en "${event.metadata.title}"`,
          { eventId: req.params.eventId }
        ).catch(() => {})
      )
    );

    await album.populate('photos.uploader', 'profile.firstName profile.lastName profile.avatar');
    const canModerate = await userCanModerateEvent(req.user, req.params.eventId);

    res.status(201).json({
      ...formatAlbumResponse(album, req.user, canModerate),
      message: 'Foto enviada. Un moderador u organizador la revisará antes de publicarla.',
    });
  } catch (error) {
    console.error('addAlbumPhoto:', error);
    res.status(500).json({ error: 'No se pudo subir la foto.' });
  }
};

const reviewAlbumPhoto = async (req, res) => {
  try {
    const { eventId, photoId } = req.params;
    const { action, reason } = req.body;

    const canModerate = await userCanModerateEvent(req.user, eventId);
    if (!canModerate) {
      return res.status(403).json({ error: 'No tienes permiso para moderar este álbum.' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Acción inválida (approve o reject).' });
    }

    const album = await CollaborativeAlbum.findOne({ event: eventId });
    if (!album) return res.status(404).json({ error: 'Álbum no encontrado.' });

    const photo = album.photos.id(photoId);
    if (!photo) return res.status(404).json({ error: 'Foto no encontrada.' });
    if (photo.status !== 'pending') {
      return res.status(400).json({ error: 'Esta foto ya fue revisada.' });
    }

    photo.status = action === 'approve' ? 'approved' : 'rejected';
    photo.reviewedBy = req.user._id;
    photo.reviewedAt = new Date();
    photo.rejectionReason = action === 'reject' ? (reason || 'No cumple las normas del evento') : '';

    album.stats.pendingPhotos = Math.max(0, (album.stats.pendingPhotos || 0) - 1);
    if (action === 'approve') {
      album.stats.totalPhotos = (album.stats.totalPhotos || 0) + 1;
      await Event.findByIdAndUpdate(eventId, { $inc: { 'metrics.albumPhotos': 1 } });
    }
    await album.save();

    const event = await Event.findById(eventId).select('metadata.title');
    createNotification(
      photo.uploader,
      action === 'approve' ? 'album_approved' : 'album_rejected',
      action === 'approve' ? 'Recuerdo publicado' : 'Recuerdo no publicado',
      action === 'approve'
        ? `Tu foto ya está visible en "${event.metadata.title}"`
        : `Tu foto no fue aprobada en "${event.metadata.title}"`,
      { eventId, photoId }
    ).catch(() => {});

    await album.populate('photos.uploader', 'profile.firstName profile.lastName profile.avatar');
    res.json({
      ...formatAlbumResponse(album, req.user, true),
      message: action === 'approve' ? 'Foto aprobada y publicada.' : 'Foto rechazada.',
    });
  } catch (error) {
    console.error('reviewAlbumPhoto:', error);
    res.status(500).json({ error: 'No se pudo revisar la foto.' });
  }
};

const loadTicketForUser = async (userId, eventId, { rotate = false } = {}) => {
  const ticket = await Ticket.findOne({ user: userId, event: eventId, status: 'active' });
  if (!ticket) return null;

  const event = await Event.findById(eventId);
  const user = await User.findById(userId);
  if (!event || !user) return null;

  const walletEntry = user.wallet.find(
    (w) => String(w.eventId) === String(eventId) || String(w.eventId?._id) === String(eventId)
  );

  const rotationIndex = rotate ? ticket.rotationIndex + 1 : ticket.rotationIndex;
  const { token, tokenHash, qrDataUrl, expiresAt, ttlSeconds } = await generateQRToken(
    userId,
    eventId,
    rotationIndex
  );

  ticket.tokenHash = tokenHash;
  ticket.rotationIndex = rotationIndex;
  ticket.expiresAt = expiresAt;
  ticket.lastRotatedAt = new Date();
  await ticket.save();

  if (walletEntry) {
    walletEntry.qrToken = token;
    await user.save();
  }

  return {
    ticket: buildTicketView({
      event,
      user,
      ticket,
      qrDataUrl,
      ttlSeconds,
      token,
      walletIssuedAt: walletEntry?.issuedAt,
    }),
    token,
  };
};

const getMyTicket = async (req, res) => {
  try {
    const eventId = req.params.eventId || req.params.id;
    const payload = await loadTicketForUser(req.user._id, eventId, { rotate: false });
    if (!payload) return res.status(404).json({ error: 'No tienes entrada activa para este evento.' });
    res.json({ ticket: payload.ticket, message: 'Entrada activa.' });
  } catch (error) {
    console.error('getMyTicket:', error);
    res.status(500).json({ error: 'No se pudo cargar tu entrada.' });
  }
};

const refreshTicketQR = async (req, res) => {
  try {
    const eventId = req.params.eventId || req.params.id;
    const payload = await loadTicketForUser(req.user._id, eventId, { rotate: true });
    if (!payload) return res.status(404).json({ error: 'No tienes entrada activa.' });
    res.json({
      ticket: payload.ticket,
      token: payload.token,
      message: 'Código actualizado.',
    });
  } catch (error) {
    console.error('refreshTicketQR:', error);
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
  reviewAlbumPhoto,
  getMyTicket,
  refreshTicketQR,
  getWhatsAppInvite,
  getUserBadgeWall,
};
