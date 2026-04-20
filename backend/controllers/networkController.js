const User = require('../models/User');
const Connection = require('../models/Connection');
const Discourse = require('../models/Discourse');

const suggestedNodes = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const userDisciplines = currentUser.profile.disciplines || [];

    const existingConnections = await Connection.find({
      $or: [
        { requester: req.user._id },
        { recipient: req.user._id }
      ]
    });

    const connectedIds = existingConnections.map(c => 
      c.requester.toString() === req.user._id.toString() ? c.recipient : c.requester
    );
    connectedIds.push(req.user._id);

    let suggestions;
    if (userDisciplines.length > 0) {
      suggestions = await User.find({
        _id: { $nin: connectedIds },
        'profile.disciplines': { $in: userDisciplines }
      })
      .select('profile credentials metrics')
      .limit(15);
    } else {
      suggestions = await User.find({
        _id: { $nin: connectedIds }
      })
      .select('profile credentials metrics')
      .limit(15);
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Suggested nodes error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions.' });
  }
};

const discourseRooms = async (req, res) => {
  try {
    const rooms = await Discourse.find({ isActive: true })
      .populate('eventId', 'metadata.title metadata.type isLive')
      .populate('members', 'profile.firstName profile.lastName profile.avatar')
      .sort({ updatedAt: -1 });

    res.json({ rooms });
  } catch (error) {
    console.error('Discourse rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch discourse rooms.' });
  }
};

const sendConnectionRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot connect with yourself.' });
    }

    const existing = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: recipientId },
        { requester: recipientId, recipient: req.user._id }
      ]
    });

    if (existing) {
      return res.status(400).json({ error: 'Connection request already exists.' });
    }

    const connection = new Connection({
      requester: req.user._id,
      recipient: recipientId
    });
    await connection.save();

    res.status(201).json({ message: 'Connection request sent.', connection });
  } catch (error) {
    console.error('Connection error:', error);
    res.status(500).json({ error: 'Failed to send connection request.' });
  }
};

const getConnections = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [
        { requester: req.user._id, status: 'accepted' },
        { recipient: req.user._id, status: 'accepted' }
      ]
    })
    .populate('requester', 'profile.firstName profile.lastName profile.title profile.avatar')
    .populate('recipient', 'profile.firstName profile.lastName profile.title profile.avatar');

    res.json({ connections });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch connections.' });
  }
};

const acceptConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found.' });
    }

    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    connection.status = 'accepted';
    await connection.save();

    await User.findByIdAndUpdate(connection.requester, { $inc: { 'metrics.connections': 1 } });
    await User.findByIdAndUpdate(connection.recipient, { $inc: { 'metrics.connections': 1 } });

    res.json({ message: 'Connection accepted.', connection });
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept connection.' });
  }
};

module.exports = { suggestedNodes, discourseRooms, sendConnectionRequest, getConnections, acceptConnection };
