const express = require('express');
const router = express.Router();
const {
  suggestedNodes,
  discourseRooms,
  sendConnectionRequest,
  getConnections,
  getNetworkHub,
  getConnectionStatus,
  acceptConnection,
  declineConnection,
} = require('../controllers/networkController');
const { auth } = require('../middleware/auth');

router.get('/suggested-nodes', auth, suggestedNodes);
router.get('/discourse-rooms', auth, discourseRooms);
router.get('/connections', auth, getConnections);
router.get('/hub', auth, getNetworkHub);
router.get('/status/:userId', auth, getConnectionStatus);
router.post('/connect', auth, sendConnectionRequest);
router.put('/connect/:id/accept', auth, acceptConnection);
router.put('/connect/:id/decline', auth, declineConnection);

module.exports = router;
