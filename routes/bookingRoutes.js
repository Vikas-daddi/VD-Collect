const express = require('express');
const { createBooking, getBookings, updateBookingStatus, assignCollector, getCollectorAssignments } = require('../controllers/bookingController');
const { auth, isAdmin } = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, createBooking);
router.get('/', auth, getBookings);
router.get('/my-assignments', auth, getCollectorAssignments);
router.put('/:id', auth, isAdmin, updateBookingStatus);
router.put('/:id/assign', auth, isAdmin, assignCollector);

module.exports = router;
