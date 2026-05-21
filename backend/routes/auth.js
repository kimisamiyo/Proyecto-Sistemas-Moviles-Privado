const express = require('express');
const router = express.Router();
const { register, login, getMe, updateLocation } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerRules, loginRules } = require('../validators');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/me', auth, getMe);
router.put('/location', auth, updateLocation);

module.exports = router;
