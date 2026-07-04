const Event = require('../models/Event');
const EventWall = require('../models/EventWall');
const MatchGroup = require('../models/MatchGroup');
const CollaborativeAlbum = require('../models/CollaborativeAlbum');
const CommunityType = require('../models/CommunityType');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { generateQRToken, verifyQRToken } = require('../utils/qrGenerator');
const { pickCover } = require('../config/demoImages');
const { userCanModerateEvent } = require('../utils/albumPermissions');
const { createNotification } = require('../services/notificationService');
const { buildTicketView } = require('../utils/ticketPayload');
const { evaluateBadgesForUser, awardBadgeBySlug } = require('../services/badgeService');

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

    evaluateBadgesForUser(req.user._id, { eventId: event._id }).catch(() => {});
    if (community.slug === 'quedada') {
      awardBadgeBySlug(req.user._id, 'anfitrion_quedada', { eventId: event._id }).catch(() => {});
    }

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

    evaluateBadgesForUser(req.user._id, { eventId: req.params.eventId }).catch(() => {});

    res.json({ wall, message: 'Publicación agregada al muro.' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo publicar en el muro.' });
  }
};

const reactToWallPost = async (req, res) => {
  try {
    const { emoji = '❤️' } = req.body;
    const wall = await EventWall.findOne({ event: req.params.eventId });
    if (!wall) return res.status(404).json({ error: 'Muro no encontrado.' });

    const post = wall.posts.id(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Publicación no encontrada.' });

    const uid = req.user._id.toString();
    const existing = post.reactions.findIndex(
      (r) => r.user.toString() === uid && r.emoji === emoji
    );
    if (existing >= 0) {
      post.reactions.splice(existing, 1);
    } else {
      post.reactions.push({ user: req.user._id, emoji });
      if (post.author.toString() !== uid) {
        createNotification(
          post.author,
          'wall_reply',
          'Reaccionaron a tu publicación',
          `${req.user.profile?.firstName || 'Alguien'} reaccionó ${emoji} en el muro del evento.`,
          { eventId: req.params.eventId, postId: post._id }
        ).catch(() => {});
      }
    }
    await wall.save();

    const populated = await EventWall.findOne({ event: req.params.eventId })
      .populate('posts.author', 'profile.firstName profile.lastName profile.avatar');
    res.json({ wall: populated, reacted: existing < 0 });
  } catch (error) {
    console.error('reactToWallPost:', error);
    res.status(500).json({ error: 'No se pudo reaccionar.' });
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

// Afinidad real: coincidencias de intereses/afinidades del usuario con los
// miembros del grupo y con los affinityTags de la comunidad del evento.
const computeAffinityScore = (user, groupMembers = [], communityTags = []) => {
  const mySignals = new Set(
    [
      ...(user.profile?.interests || []),
      ...(user.profile?.disciplines || []),
      ...(user.profile?.communityAffinities || []),
      ...(user.preferences?.favoriteCommunities || []),
    ].map((s) => s.toLowerCase().trim())
  );

  let base = 55;
  const tagMatches = communityTags.filter((t) => mySignals.has(t.toLowerCase().trim())).length;
  base += Math.min(tagMatches * 8, 24);

  let memberOverlap = 0;
  for (const member of groupMembers) {
    const theirSignals = [
      ...(member.user?.profile?.interests || []),
      ...(member.user?.profile?.disciplines || []),
    ].map((s) => s.toLowerCase().trim());
    if (theirSignals.some((s) => mySignals.has(s))) memberOverlap += 1;
  }
  if (groupMembers.length > 0) {
    base += Math.round((memberOverlap / groupMembers.length) * 20);
  }

  return Math.max(40, Math.min(99, base));
};

const joinMatchmaking = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado.' });

    const me = await User.findById(req.user._id);
    if (me?.preferences?.matchmakingOpen === false) {
      return res.status(400).json({ error: 'Tienes el matchmaking desactivado en tus preferencias.' });
    }

    const alreadyInGroup = await MatchGroup.findOne({
      event: event._id,
      status: { $ne: 'dissolved' },
      'members.user': req.user._id,
    });
    if (alreadyInGroup) {
      if (req.body?.force) {
        alreadyInGroup.members = alreadyInGroup.members.filter(
          (m) => String(m.user) !== String(req.user._id)
        );
        if (alreadyInGroup.members.length === 0) {
          alreadyInGroup.status = 'dissolved';
        } else if (alreadyInGroup.status === 'ready') {
          alreadyInGroup.status = 'forming';
        }
        await alreadyInGroup.save();
      } else {
        return res.status(400).json({
          error: 'Ya estás en un grupo para este evento.',
          currentGroupId: alreadyInGroup._id,
          canSwitch: true,
        });
      }
    }

    const community = await CommunityType.findOne({ slug: event.metadata.communitySlug });
    const communityTags = community?.matchmaking?.affinityTags || [];

    // Entre los grupos abiertos, elegir el de mayor afinidad con el usuario.
    const openGroups = await MatchGroup.find({
      event: event._id,
      status: 'forming',
      $expr: { $lt: [{ $size: '$members' }, '$maxSize'] },
    }).populate('members.user', 'profile.interests profile.disciplines');

    let openGroup = null;
    let bestScore = -1;
    for (const g of openGroups) {
      const score = computeAffinityScore(me, g.members, communityTags);
      if (score > bestScore) {
        bestScore = score;
        openGroup = g;
      }
    }

    const affinityScore = openGroup
      ? bestScore
      : computeAffinityScore(me, [], communityTags);
    const memberEntry = { user: req.user._id, status: 'accepted', joinedAt: new Date(), affinityScore };

    if (openGroup) {
      openGroup.members.push(memberEntry);
      if (openGroup.members.length >= openGroup.maxSize) {
        openGroup.status = 'ready';
        await Promise.all(
          openGroup.members.map((m) =>
            createNotification(
              m.user?._id || m.user,
              'match_found',
              '¡Grupo completo!',
              `Tu grupo para "${event.metadata.title}" está listo. ¡No irás solo!`,
              { eventId: event._id, groupId: openGroup._id }
            ).catch(() => {})
          )
        );
      }
      await openGroup.save();
    } else {
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

const leaveMatchmaking = async (req, res) => {
  try {
    const group = await MatchGroup.findOne({
      event: req.params.eventId,
      status: { $ne: 'dissolved' },
      'members.user': req.user._id,
    });
    if (!group) {
      return res.status(404).json({ error: 'No estás en ningún grupo para este evento.' });
    }
    group.members = group.members.filter((m) => String(m.user) !== String(req.user._id));
    if (group.members.length === 0) {
      group.status = 'dissolved';
    } else if (group.status === 'ready') {
      group.status = 'forming';
    }
    await group.save();
    res.json({ message: 'Saliste del grupo.', groupId: group._id });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo salir del grupo.' });
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

/**
 * Check-in con QR dinámico anti-fraude.
 * Solo organizadores/moderadores del evento pueden escanear. Valida:
 *  1. Token decodificable y dentro del TTL (capturas viejas no sirven).
 *  2. Hash coincide con la última rotación guardada del ticket.
 *  3. Ticket activo (no usado, revocado ni de otro evento).
 */
const checkInTicket = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { token, deviceFingerprint = '' } = req.body;
    if (!token) return res.status(400).json({ error: 'Token QR requerido.' });

    const canScan = await userCanModerateEvent(req.user, eventId);
    if (!canScan) {
      return res.status(403).json({ error: 'Solo el organizador o staff puede validar entradas.' });
    }

    const result = verifyQRToken(token);
    if (!result.valid) {
      const reason = result.reason === 'expired'
        ? 'El código expiró. Pide al asistente que muestre su QR actualizado (se regenera solo).'
        : 'Código QR inválido.';
      return res.status(400).json({ error: reason, reason: result.reason });
    }

    const { payload, tokenHash } = result;
    if (payload.eventId !== eventId) {
      return res.status(400).json({ error: 'Esta entrada pertenece a otro evento.', reason: 'wrong_event' });
    }

    const ticket = await Ticket.findOne({ user: payload.userId, event: eventId });
    if (!ticket) {
      return res.status(404).json({ error: 'No existe entrada para este asistente.', reason: 'not_found' });
    }
    if (ticket.status === 'used') {
      return res.status(409).json({
        error: 'Entrada ya utilizada. Posible intento de re-uso.',
        reason: 'already_used',
        checkInAt: ticket.checkInAt,
      });
    }
    if (ticket.status !== 'active') {
      return res.status(400).json({ error: `Entrada ${ticket.status}.`, reason: ticket.status });
    }
    if (ticket.tokenHash !== tokenHash) {
      return res.status(409).json({
        error: 'Código obsoleto: el QR ya rotó. Pide el código vigente en la app (anti-captura).',
        reason: 'stale_token',
      });
    }

    ticket.status = 'used';
    ticket.checkInAt = new Date();
    ticket.deviceFingerprint = deviceFingerprint;
    await ticket.save();

    const [event, attendee] = await Promise.all([
      Event.findByIdAndUpdate(eventId, { $inc: { 'metrics.checkIns': 1 } }, { new: true }),
      User.findById(payload.userId),
    ]);

    attendee.metrics.checkIns += 1;
    attendee.metrics.impactPoints += 10;
    await attendee.save();

    // Secuencial para no otorgar la misma insignia dos veces en paralelo
    awardBadgeBySlug(attendee._id, 'entrada_verificada', { eventId })
      .then(() => evaluateBadgesForUser(attendee._id, { eventId }))
      .catch(() => {});

    createNotification(
      attendee._id,
      'event_register',
      'Check-in confirmado',
      `Tu entrada a "${event.metadata.title}" fue validada. ¡Disfruta el evento!`,
      { eventId }
    ).catch(() => {});

    res.json({
      success: true,
      message: 'Check-in verificado. Entrada válida.',
      attendee: {
        id: attendee._id,
        fullName: `${attendee.profile?.firstName || ''} ${attendee.profile?.lastName || ''}`.trim(),
        avatar: attendee.profile?.avatar || '',
        email: attendee.email,
      },
      checkInAt: ticket.checkInAt,
      totalCheckIns: event.metrics.checkIns,
    });
  } catch (error) {
    console.error('checkInTicket:', error);
    res.status(500).json({ error: 'No se pudo validar la entrada.' });
  }
};

/**
 * Dashboard agregado del creador: todas sus iniciativas con KPIs consolidados.
 */
const getCreatorDashboard = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id }).sort({ 'schedule.date': -1 });

    const totals = {
      eventsPublished: events.length,
      registrations: 0,
      checkIns: 0,
      views: 0,
      shares: 0,
      wallPosts: 0,
      albumPhotos: 0,
      matchGroupsFormed: 0,
    };

    const eventSummaries = events.map((e) => {
      totals.registrations += e.metrics.registrations || 0;
      totals.checkIns += e.metrics.checkIns || 0;
      totals.views += e.metrics.views || 0;
      totals.shares += e.metrics.shares || 0;
      totals.wallPosts += e.metrics.wallPosts || 0;
      totals.albumPhotos += e.metrics.albumPhotos || 0;
      totals.matchGroupsFormed += e.metrics.matchGroupsFormed || 0;
      return {
        _id: e._id,
        title: e.metadata.title,
        communitySlug: e.metadata.communitySlug,
        coverImage: e.metadata.coverImage,
        date: e.schedule.date,
        startTime: e.schedule.startTime,
        venue: e.location.venue,
        capacity: e.capacity,
        capacityFill: e.capacity.max
          ? Math.round(((e.capacity.current || 0) / e.capacity.max) * 100)
          : 0,
        metrics: e.metrics,
      };
    });

    totals.attendanceRate = totals.registrations
      ? Math.round((totals.checkIns / totals.registrations) * 100)
      : 0;

    res.json({ totals, events: eventSummaries });
  } catch (error) {
    console.error('getCreatorDashboard:', error);
    res.status(500).json({ error: 'No se pudo cargar tu panel de creador.' });
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

    evaluateBadgesForUser(req.user._id, { eventId: event._id }).catch(() => {});

    const title = event.metadata.title;
    const code = event.sharing.inviteCode;
    const deepLink = `eventus://event/${event._id}`;
    const downloadUrl = 'https://expo.dev/@jesusrazos-team/event-us';
    const message =
      `🎉 *${title}*\n\n` +
      `Te invito a este evento en EventUs. ¡No vayas solo!\n\n` +
      `📲 Abre la app: ${deepLink}\n` +
      `🔑 Código: ${code}\n\n` +
      `¿No tienes la app? Descárgala aquí: ${downloadUrl}`;

    const text = encodeURIComponent(message);
    const waUrl = `https://wa.me/?text=${text}`;

    res.json({
      whatsappUrl: waUrl,
      inviteCode: code,
      deepLink,
      message,
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
  reactToWallPost,
  getMatchGroups,
  joinMatchmaking,
  leaveMatchmaking,
  getEventMetrics,
  getCreatorDashboard,
  getAlbum,
  addAlbumPhoto,
  reviewAlbumPhoto,
  getMyTicket,
  refreshTicketQR,
  checkInTicket,
  getWhatsAppInvite,
  getUserBadgeWall,
};
