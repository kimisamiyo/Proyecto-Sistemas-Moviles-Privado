const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage } = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getConversations);
router.get('/:userId', auth, getMessages);
router.post('/', auth, sendMessage);

module.exports = router;
