const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const CommunityType = require('../models/CommunityType');
const { generateQRToken } = require('../utils/qrGenerator');
const { sendEventRegistration } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const { formatSquad } = require('./squadController');
const Squad = require('../models/Squad');
const { buildTicketView } = require('../utils/ticketPayload');
const { enrichEventSchedule, getEventPhase, isEventActive } = require('../utils/eventSchedule');
const { getMyTicket, refreshTicketQR } = require('./eventusController');

const populateEventQuery = (query) =>
  query
    .populate('hosts.userId', 'profile.firstName profile.lastName profile.title profile.avatar')
    .populate('speakers.userId', 'profile.firstName profile.lastName profile.avatar')
    .populate('createdBy', 'profile.firstName profile.lastName profile.avatar');

const explore = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = {};

    if (type) query['metadata.type'] = type;
    if (req.query.community) query['metadata.communitySlug'] = req.query.community;

    const now = new Date();
    const allFetched = await populateEventQuery(Event.find(query)).sort({ 'schedule.date': 1 });
    const enrichedAll = allFetched.map((e) => enrichEventSchedule(e, now));
    const activeEvents = enrichedAll.filter((e) => isEventActive(e.schedule, now));
    const events = activeEvents.slice((page - 1) * limit, page * limit);
    const liveEvents = activeEvents.filter((e) => e.schedulePhase === 'live');

    const communities = await CommunityType.find({ isActive: true }).sort({ sortOrder: 1 });
    const total = activeEvents.length;

    const openSquadsRaw = await Squad.find({ status: 'recruiting' })
      .populate(
        'event',
        'metadata.title metadata.communitySlug metadata.coverImage schedule.date schedule.startTime schedule.endTime location.venue'
      )
      .populate('leader', 'profile.firstName profile.lastName profile.avatar')
      .sort({ updatedAt: -1 })
      .limit(24);

    const openSquads = openSquadsRaw
      .filter((s) => s.event && isEventActive(s.event.schedule, now))
      .slice(0, 12)
      .map(formatSquad);

    res.json({
      events,
      liveEvents,
      communities,
      openSquads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Explore error:', error);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await populateEventQuery(Event.findById(req.params.id))
      .populate('attendees', 'profile.firstName profile.lastName profile.avatar profile.title badges');

    if (!event) return res.status(404).json({ error: 'Event not found.' });

    const community = await CommunityType.findOne({ slug: event.metadata.communitySlug });
    const squads = await Squad.find({ event: event._id, status: { $in: ['recruiting', 'full'] } })
      .populate('leader', 'profile.firstName profile.lastName profile.avatar')
      .populate('members.user', 'profile.firstName profile.lastName profile.avatar')
      .limit(20);

    const attendeeSquads = {};
    let mySquad = null;
    const uid = req.user?._id?.toString();

    for (const squad of squads) {
      const formatted = formatSquad(squad);
      for (const m of squad.members || []) {
        if (m.status !== 'active') continue;
        const memberId = (m.user?._id || m.user)?.toString();
        if (!memberId) continue;
        attendeeSquads[memberId] = {
          _id: squad._id,
          name: squad.name,
          plan: squad.plan,
          activeCount: formatted.activeCount,
          maxSize: squad.maxSize,
        };
        if (uid && memberId === uid) mySquad = formatted;
      }
    }

    res.json({
      event: enrichEventSchedule(event),
      community,
      squads: squads.map(formatSquad),
      mySquad,
      attendeeSquads,
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event details.' });
  }
};

const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    if (getEventPhase(event.schedule) === 'past') {
      return res.status(400).json({ error: 'Este evento ya finalizó. Solo puedes ver el muro y los recuerdos.' });
    }

    if (event.capacity.isLimited && event.capacity.current >= event.capacity.max) {
      return res.status(400).json({ error: 'El evento ya alcanzó el cupo máximo.' });
    }

    const existingTicket = await Ticket.findOne({ user: userId, event: eventId, status: 'active' });
    if (existingTicket) {
      const user = await User.findById(userId);
      const walletEntry = user.wallet.find(
        (w) => String(w.eventId) === String(eventId) || String(w.eventId?._id) === String(eventId)
      );
      const { token, tokenHash, qrDataUrl, expiresAt, ttlSeconds } = await generateQRToken(
        userId,
        eventId,
        existingTicket.rotationIndex
      );
      existingTicket.tokenHash = tokenHash;
      existingTicket.expiresAt = expiresAt;
      existingTicket.lastRotatedAt = new Date();
      await existingTicket.save();
      if (walletEntry) {
        walletEntry.qrToken = token;
        await user.save();
      }
      return res.json({
        message: 'Ya tienes una entrada activa para este evento.',
        alreadyRegistered: true,
        ticket: buildTicketView({
          event,
          user,
          ticket: existingTicket,
          qrDataUrl,
          ttlSeconds,
          token,
          walletIssuedAt: walletEntry?.issuedAt,
        }),
      });
    }

    const alreadyRegistered = event.attendees.some(
      (attendee) => attendee.toString() === userId.toString()
    );
    if (alreadyRegistered) {
      const user = await User.findById(userId);
      const { token, tokenHash, qrDataUrl, expiresAt, ttlSeconds } = await generateQRToken(
        userId,
        eventId,
        0
      );
      const ticket = await Ticket.create({
        user: userId,
        event: eventId,
        tokenHash,
        expiresAt,
        rotationIndex: 0,
      });
      const hasWallet = user.wallet.some(
        (w) => String(w.eventId) === String(eventId) || String(w.eventId?._id) === String(eventId)
      );
      if (!hasWallet) {
        user.wallet.push({
          eventId,
          ticketId: ticket._id,
          qrToken: token,
          accessType: 'Entrada EventUs',
          issuedAt: new Date(),
        });
        await user.save();
      }
      return res.json({
        message: 'Entrada activada. Tu QR dinámico está listo.',
        alreadyRegistered: true,
        ticket: buildTicketView({
          event,
          user,
          ticket,
          qrDataUrl,
          ttlSeconds,
          token,
          walletIssuedAt: new Date(),
        }),
      });
    }

    const { token, tokenHash, qrDataUrl, expiresAt, ttlSeconds } = await generateQRToken(userId, eventId, 0);

    const ticket = await Ticket.create({
      user: userId,
      event: eventId,
      tokenHash,
      expiresAt,
      rotationIndex: 0,
    });

    event.attendees.push(userId);
    event.capacity.current += 1;
    event.metrics.registrations += 1;
    await event.save();

    const user = await User.findById(userId);
    user.wallet.push({
      eventId,
      ticketId: ticket._id,
      qrToken: token,
      accessType: 'Entrada EventUs',
      issuedAt: new Date(),
    });
    user.metrics.eventsAttended += 1;
    user.metrics.impactPoints += 15;
    await user.save();

    const ticketPayload = {
      eventId,
      ticketId: ticket._id,
      ttlSeconds,
    };
    sendEventRegistration(user, event, ticketPayload).catch(() => {});
    createNotification(
      userId,
      'event_register',
      'Inscripción confirmada',
      event.metadata.title,
      { eventId }
    ).catch(() => {});

    res.json({
      message: 'Inscripción confirmada. Tu QR dinámico está activo.',
      ticket: buildTicketView({
        event,
        user,
        ticket,
        qrDataUrl,
        ttlSeconds,
        token,
        walletIssuedAt: new Date(),
      }),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

const radar = async (req, res) => {
  try {
    const { longitude, latitude, radius = 2000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Longitude and latitude are required.' });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);

    const now = new Date();
    const nearbyRaw = await Event.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: parseInt(radius)
        }
      }
    })
    .populate('speakers.userId', 'profile.firstName profile.lastName profile.avatar')
    .limit(40);

    const nearbyEvents = nearbyRaw
      .map((e) => enrichEventSchedule(e, now))
      .filter((e) => isEventActive(e.schedule, now))
      .slice(0, 20);

    const nearbyUsers = await User.find({
      _id: { $ne: req.user._id },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: parseInt(radius)
        }
      },
      isOnline: true
    })
    .select('profile.firstName profile.lastName profile.title profile.avatar location')
    .limit(30);

    res.json({
      nearbyEvents,
      nearbyUsers,
      searchRadius: parseInt(radius)
    });
  } catch (error) {
    console.error('Radar error:', error);
    res.status(500).json({ error: 'Radar query failed.' });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find()
      .populate('speakers.userId', 'profile.firstName profile.lastName profile.title profile.avatar')
      .sort({ 'schedule.date': 1 });
    const enriched = events.map((e) => enrichEventSchedule(e, now));
    const active = enriched.filter((e) => isEventActive(e.schedule, now));
    res.json({ events: active });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
};

const getAttendedPastEvents = async (req, res) => {
  try {
    const now = new Date();
    const user = await User.findById(req.user._id).populate(
      'wallet.eventId',
      'metadata schedule location features'
    );
    const past = [];
    for (const entry of user?.wallet || []) {
      const ev = entry.eventId;
      if (!ev?._id) continue;
      const enriched = enrichEventSchedule(ev, now);
      if (enriched.schedulePhase === 'past') past.push(enriched);
    }
    past.sort((a, b) => new Date(b.schedule?.date) - new Date(a.schedule?.date));
    res.json({ events: past });
  } catch (error) {
    console.error('getAttendedPastEvents:', error);
    res.status(500).json({ error: 'No se pudieron cargar eventos pasados.' });
  }
};

module.exports = {
  explore,
  getEventById,
  registerForEvent,
  radar,
  getAllEvents,
  getAttendedPastEvents,
  getMyTicket,
  refreshTicketQR,
};
