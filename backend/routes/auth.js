const express = require('express');
const router = express.Router();
const { register, login, getMe, updateLocation } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/location', auth, updateLocation);

module.exports = router;
