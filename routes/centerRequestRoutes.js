const express = require('express');
const { createRequest, getRequests, updateRequestStatus } = require('../controllers/centerRequestController');
const { auth, isAdmin } = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, createRequest);
router.get('/', auth, isAdmin, getRequests);
router.put('/:id', auth, isAdmin, updateRequestStatus);

module.exports = router;
