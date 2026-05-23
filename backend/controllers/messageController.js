const Message = require('../models/Message');
const User = require('../models/User');
const Connection = require('../models/Connection');

const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$content' },
          lastTimestamp: { $first: '$createdAt' },
          unread: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { lastTimestamp: -1 } }
    ]);

    const conversationIds = messages.map(m => m._id);
    const users = await User.find({ _id: { $in: conversationIds } })
      .select('profile.firstName profile.lastName profile.avatar profile.title');

    const conversations = messages.map(msg => {
      const user = users.find(u => u._id.toString() === msg._id.toString());
      return {
        userId: msg._id,
        user: user ? user.toPublicJSON() : null,
        lastMessage: msg.lastMessage,
        lastTimestamp: msg.lastTimestamp,
        unread: msg.unread
      };
    });

    res.json({ conversations });
  } catch (error) {
    console.error('Conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    await Message.updateMany(
      { sender: userId, receiver: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver and content are required.' });
    }

    const connected = await Connection.findOne({
      status: 'accepted',
      $or: [
        { requester: req.user._id, recipient: receiverId },
        { requester: receiverId, recipient: req.user._id },
      ],
    });
    if (!connected) {
      return res.status(403).json({
        error: 'Debes estar conectado con esta persona. Envía una solicitud desde su perfil.',
      });
    }

    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content
    });

    await message.save();
    res.status(201).json({ message: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
};

module.exports = { getConversations, getMessages, sendMessage };
