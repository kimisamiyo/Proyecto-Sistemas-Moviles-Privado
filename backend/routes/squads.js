const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createSquadRules, joinSquadRules } = require('../validators');
const {
  listOpenSquads,
  getMySquads,
  getSquadById,
  createSquad,
  joinSquad,
  leaveSquad,
  approveMember,
} = require('../controllers/squadController');

router.get('/open', auth, listOpenSquads);
router.get('/my', auth, getMySquads);
router.get('/:squadId', auth, getSquadById);
router.post('/', auth, createSquadRules, validate, createSquad);
router.post('/:squadId/join', auth, joinSquadRules, validate, joinSquad);
router.post('/:squadId/leave', auth, leaveSquad);
router.post('/:squadId/approve/:userId', auth, approveMember);

module.exports = router;
