const express = require('express');
const router = express.Router();
const { explore, getEventById, registerForEvent, radar, getAllEvents } = require('../controllers/eventController');
const { auth } = require('../middleware/auth');

router.get('/explore', auth, explore);
router.get('/radar', auth, radar);
router.get('/all', auth, getAllEvents);
router.get('/:id', auth, getEventById);
router.post('/register/:eventId', auth, registerForEvent);

module.exports = router;
