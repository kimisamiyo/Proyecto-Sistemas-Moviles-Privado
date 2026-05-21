const express = require('express');
const router = express.Router();
const { listCommunities, getCommunityBySlug, listBadges } = require('../controllers/communityController');

router.get('/', listCommunities);
router.get('/badges/all', listBadges);
router.get('/:slug', getCommunityBySlug);

module.exports = router;
