const express = require('express');
const { createBooking, getBookings, updateBookingStatus, assignCollector, getCollectorAssignments } = require('../controllers/bookingController');
const { auth, isAdmin, isAdminOrCollector } = require('../middleware/auth');
const router = express.Router();
const { body } = require('express-validator');
const { id, booking, validate } = require('../middleware/validation');

router.post('/', auth, booking, createBooking);
router.get('/', auth, getBookings);
router.get('/my-assignments', auth, isAdminOrCollector, getCollectorAssignments);
router.put('/:id/assign', auth, isAdmin, id,
  body('collectorId').isMongoId().withMessage('Invalid collector ID'), validate, assignCollector);
router.put('/:id', auth, isAdminOrCollector, id,
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid booking status'), validate, updateBookingStatus);

module.exports = router;
