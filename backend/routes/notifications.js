const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { listNotifications, markRead } = require('../controllers/notificationController');

router.get('/', auth, listNotifications);
router.patch('/read', auth, markRead);

module.exports = router;
