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

    const { createNotification } = require('../services/notificationService');
    createNotification(
      recipientId,
      'connection_request',
      'Nueva solicitud de conexión',
      `${req.user.profile?.firstName || 'Alguien'} quiere conectar contigo`,
      { connectionId: connection._id, requesterId: req.user._id }
    ).catch(() => {});

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

const formatConnectionPeer = (connection, userId) => {
  const isRequester = connection.requester._id.toString() === userId.toString();
  const peer = isRequester ? connection.recipient : connection.requester;
  return {
    connectionId: connection._id,
    status: connection.status,
    role: isRequester ? 'requester' : 'recipient',
    user: peer,
    userId: peer._id,
  };
};

const getNetworkHub = async (req, res) => {
  try {
    const userId = req.user._id;
    const connections = await Connection.find({
      $or: [{ requester: userId }, { recipient: userId }],
    })
      .populate('requester', 'profile.firstName profile.lastName profile.title profile.avatar isOnline')
      .populate('recipient', 'profile.firstName profile.lastName profile.title profile.avatar isOnline')
      .sort({ updatedAt: -1 });

    const accepted = [];
    const pendingIncoming = [];
    const pendingOutgoing = [];
    const connectedIds = [userId];

    for (const c of connections) {
      const row = formatConnectionPeer(c, userId);
      if (c.status === 'accepted') {
        accepted.push(row);
        connectedIds.push(row.userId);
      } else if (c.status === 'pending') {
        if (row.role === 'recipient') pendingIncoming.push(row);
        else pendingOutgoing.push(row);
        connectedIds.push(row.userId);
      }
    }

    const suggestions = await User.find({ _id: { $nin: connectedIds } })
      .select('profile.firstName profile.lastName profile.title profile.avatar isOnline metrics.impactPoints')
      .limit(12);

    res.json({ accepted, pendingIncoming, pendingOutgoing, suggestions });
  } catch (error) {
    console.error('Network hub error:', error);
    res.status(500).json({ error: 'No se pudo cargar la red.' });
  }
};

const getConnectionStatus = async (req, res) => {
  try {
    const { userId: otherId } = req.params;
    if (otherId === req.user._id.toString()) {
      return res.json({ status: 'self' });
    }

    const connection = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: otherId },
        { requester: otherId, recipient: req.user._id },
      ],
    })
      .populate('requester', 'profile.firstName profile.lastName profile.avatar')
      .populate('recipient', 'profile.firstName profile.lastName profile.avatar');

    if (!connection) return res.json({ status: 'none' });
    if (connection.status === 'accepted') {
      return res.json({ status: 'connected', connectionId: connection._id });
    }
    if (connection.status === 'pending') {
      const incoming = connection.recipient.toString() === req.user._id.toString();
      return res.json({
        status: incoming ? 'pending_incoming' : 'pending_outgoing',
        connectionId: connection._id,
      });
    }
    return res.json({ status: 'declined' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo verificar la conexión.' });
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

const declineConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'No autorizado.' });
    }
    connection.status = 'declined';
    await connection.save();
    res.json({ message: 'Solicitud rechazada.' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo rechazar.' });
  }
};

module.exports = {
  suggestedNodes,
  discourseRooms,
  sendConnectionRequest,
  getConnections,
  getNetworkHub,
  getConnectionStatus,
  acceptConnection,
  declineConnection,
};
