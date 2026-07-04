const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  submitRoleRequest,
  getMyRoleRequests,
  getPendingRequests,
  reviewRoleRequest,
} = require('../controllers/roleRequestController');

router.post('/', auth, submitRoleRequest);
router.get('/my', auth, getMyRoleRequests);
router.get('/pending', auth, getPendingRequests);
router.patch('/:requestId', auth, reviewRoleRequest);

module.exports = router;
