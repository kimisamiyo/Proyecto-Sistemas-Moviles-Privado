const express = require('express');
const router = express.Router();
const { suggestedNodes, discourseRooms, sendConnectionRequest, getConnections, acceptConnection } = require('../controllers/networkController');
const { auth } = require('../middleware/auth');

router.get('/suggested-nodes', auth, suggestedNodes);
router.get('/discourse-rooms', auth, discourseRooms);
router.get('/connections', auth, getConnections);
router.post('/connect', auth, sendConnectionRequest);
router.put('/connect/:id/accept', auth, acceptConnection);

module.exports = router;
