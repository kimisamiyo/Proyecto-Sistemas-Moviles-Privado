const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { sendWelcome } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, bio, title, disciplines } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const user = new User({
      email,
      passwordHash: password,
      profile: {
        firstName,
        lastName,
        bio: bio || '',
        title: title || '',
        disciplines: disciplines || []
      }
    });

    await user.save();
    const token = generateToken(user._id);

    sendWelcome(user).catch(() => {});
    createNotification(user._id, 'welcome', 'Bienvenido a EventUs', 'Explora eventos y únete a escuadras.').catch(() => {});

    res.status(201).json({
      message: 'Cuenta creada. Revisa tu correo de bienvenida.',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful.',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });
    res.json({ message: 'Location updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update location.' });
  }
};

module.exports = { register, login, getMe, updateLocation };
