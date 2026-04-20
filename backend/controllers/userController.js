const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id || req.user._id)
      .select('-passwordHash')
      .populate('wallet.eventId', 'metadata.title metadata.type schedule.date location.venue');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, title, disciplines } = req.body;
    const updates = {};

    if (firstName) updates['profile.firstName'] = firstName;
    if (lastName) updates['profile.lastName'] = lastName;
    if (bio !== undefined) updates['profile.bio'] = bio;
    if (title !== undefined) updates['profile.title'] = title;
    if (disciplines) updates['profile.disciplines'] = disciplines;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-passwordHash');

    res.json({ message: 'Profile updated.', user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('wallet')
      .populate('wallet.eventId', 'metadata.title metadata.type schedule.date location.venue');

    res.json({ wallet: user.wallet });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wallet.' });
  }
};

module.exports = { getProfile, updateProfile, getWallet };
