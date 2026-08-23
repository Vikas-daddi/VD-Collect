const express = require('express');
const { createBooking, getBookings, updateBookingStatus, assignCollector, getCollectorAssignments } = require('../controllers/bookingController');
const { auth, isAdmin, isAdminOrCollector } = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, createBooking);
router.get('/', auth, getBookings);
router.get('/my-assignments', auth, getCollectorAssignments);
router.put('/:id/assign', auth, isAdmin, assignCollector); // Note: Moved this before /:id to prevent routing issues
router.put('/:id', auth, isAdminOrCollector, updateBookingStatus);

module.exports = router;
