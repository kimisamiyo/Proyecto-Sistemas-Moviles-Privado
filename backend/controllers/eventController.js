const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const CommunityType = require('../models/CommunityType');
const { generateQRToken } = require('../utils/qrGenerator');
const { sendEventRegistration } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const { formatSquad } = require('./squadController');
const Squad = require('../models/Squad');

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

    const events = await populateEventQuery(Event.find(query))
      .sort({ 'schedule.date': 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const liveEvents = await populateEventQuery(Event.find({ isLive: true })).limit(10);
    const communities = await CommunityType.find({ isActive: true }).sort({ sortOrder: 1 });
    const total = await Event.countDocuments(query);

    const openSquads = await Squad.find({ status: 'recruiting' })
      .populate('event', 'metadata.title metadata.communitySlug')
      .populate('leader', 'profile.firstName profile.lastName profile.avatar')
      .sort({ updatedAt: -1 })
      .limit(12);

    res.json({
      events,
      liveEvents,
      communities,
      openSquads: openSquads.map(formatSquad),
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
      .populate('attendees', 'profile.firstName profile.lastName profile.avatar badges');

    if (!event) return res.status(404).json({ error: 'Event not found.' });

    const community = await CommunityType.findOne({ slug: event.metadata.communitySlug });
    const squads = await Squad.find({ event: event._id, status: { $in: ['recruiting', 'full'] } })
      .populate('leader', 'profile.firstName profile.lastName profile.avatar')
      .populate('members.user', 'profile.firstName profile.lastName profile.avatar')
      .limit(20);
    res.json({
      event,
      community,
      squads: squads.map(formatSquad),
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
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (event.capacity.isLimited && event.capacity.current >= event.capacity.max) {
      return res.status(400).json({ error: 'Event is at full capacity.' });
    }

    const alreadyRegistered = event.attendees.some(
      attendee => attendee.toString() === userId.toString()
    );
    if (alreadyRegistered) {
      return res.status(400).json({ error: 'Already registered for this event.' });
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
      ticket: {
        eventId,
        ticketId: ticket._id,
        eventTitle: event.metadata.title,
        communitySlug: event.metadata.communitySlug,
        qrToken: token,
        qrDataUrl,
        expiresAt,
        ttlSeconds,
        accessType: 'Entrada EventUs',
        venue: event.location.venue,
        date: event.schedule.date,
        startTime: event.schedule.startTime,
        inviteCode: event.sharing.inviteCode,
      },
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

    const nearbyEvents = await Event.find({
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
    .limit(20);

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
    const events = await Event.find()
      .populate('speakers.userId', 'profile.firstName profile.lastName profile.title profile.avatar')
      .sort({ 'schedule.date': 1 });
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
};

module.exports = { explore, getEventById, registerForEvent, radar, getAllEvents };
