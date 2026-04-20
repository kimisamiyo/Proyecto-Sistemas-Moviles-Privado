const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getWallet } = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.get('/wallet', auth, getWallet);
router.get('/profile/:id?', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;
