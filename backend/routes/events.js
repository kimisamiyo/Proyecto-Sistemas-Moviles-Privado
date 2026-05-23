const express = require('express');
const router = express.Router();
const {
  explore,
  getEventById,
  registerForEvent,
  radar,
  getAllEvents,
  getAttendedPastEvents,
} = require('../controllers/eventController');
const { getMyTicket, refreshTicketQR } = require('../controllers/eventController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { radarRules } = require('../validators');

router.get('/explore', auth, explore);
router.get('/radar', auth, radarRules, validate, radar);
router.get('/all', auth, getAllEvents);
router.get('/attended/past', auth, getAttendedPastEvents);
router.get('/:eventId/ticket', auth, getMyTicket);
router.post('/:eventId/ticket/refresh', auth, refreshTicketQR);
router.get('/:id', auth, getEventById);
router.post('/register/:eventId', auth, registerForEvent);

module.exports = router;
