const Event = require('../models/Event');
const User = require('../models/User');
const { generateQRToken } = require('../utils/qrGenerator');

const explore = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = {};

    if (type) {
      query['metadata.type'] = type;
    }

    const events = await Event.find(query)
      .populate('speakers.userId', 'profile.firstName profile.lastName profile.title profile.avatar')
      .sort({ 'schedule.date': 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const liveEvents = await Event.find({ isLive: true })
      .populate('speakers.userId', 'profile.firstName profile.lastName profile.avatar')
      .limit(10);

    const total = await Event.countDocuments(query);

    res.json({
      events,
      liveEvents,
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
    const event = await Event.findById(req.params.id)
      .populate('speakers.userId', 'profile.firstName profile.lastName profile.title profile.avatar profile.bio credentials')
      .populate('attendees', 'profile.firstName profile.lastName profile.avatar')
      .populate('createdBy', 'profile.firstName profile.lastName');

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    res.json({ event });
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

    const { token, qrDataUrl } = await generateQRToken(userId, eventId);

    event.attendees.push(userId);
    event.capacity.current += 1;
    await event.save();

    const user = await User.findById(userId);
    user.wallet.push({
      eventId,
      qrToken: token,
      accessType: 'General Admission',
      issuedAt: new Date()
    });
    user.metrics.eventsAttended += 1;
    await user.save();

    res.json({
      message: 'Confirmation sent. Institutional access granted.',
      ticket: {
        eventId,
        eventTitle: event.metadata.title,
        qrToken: token,
        qrDataUrl,
        accessType: 'General Admission',
        venue: event.location.venue,
        date: event.schedule.date,
        startTime: event.schedule.startTime
      }
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
