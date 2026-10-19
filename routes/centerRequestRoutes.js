const express = require('express');
const { createRequest, getRequests, updateRequestStatus } = require('../controllers/centerRequestController');
const { auth, isAdmin } = require('../middleware/auth');
const router = express.Router();
const { body } = require('express-validator');
const { id, validate } = require('../middleware/validation');

router.post('/', auth, body('location').isString().bail().trim().notEmpty().withMessage('Location is required'), validate, createRequest);
router.get('/', auth, isAdmin, getRequests);
router.put('/:id', auth, isAdmin, id,
  body('status').isIn(['pending', 'approved', 'dismissed']).withMessage('Invalid request status'), validate, updateRequestStatus);

module.exports = router;
