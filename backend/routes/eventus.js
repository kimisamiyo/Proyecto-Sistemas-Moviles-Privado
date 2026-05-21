const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createEventRules, wallPostRules } = require('../validators');
const {
  createEvent,
  getEventWall,
  postToWall,
  getMatchGroups,
  joinMatchmaking,
  getEventMetrics,
  getAlbum,
  addAlbumPhoto,
  refreshTicketQR,
  getWhatsAppInvite,
  getUserBadgeWall,
} = require('../controllers/eventusController');

router.post('/events', auth, createEventRules, validate, createEvent);
router.get('/badges/wall/:userId?', auth, getUserBadgeWall);

router.get('/events/:eventId/wall', auth, getEventWall);
router.post('/events/:eventId/wall', auth, wallPostRules, validate, postToWall);
router.get('/events/:eventId/groups', auth, getMatchGroups);
router.post('/events/:eventId/groups/join', auth, joinMatchmaking);
router.get('/events/:eventId/metrics', auth, getEventMetrics);
router.get('/events/:eventId/album', auth, getAlbum);
router.post('/events/:eventId/album', auth, addAlbumPhoto);
router.post('/events/:eventId/ticket/refresh', auth, refreshTicketQR);
router.get('/events/:eventId/invite/whatsapp', auth, getWhatsAppInvite);

module.exports = router;
