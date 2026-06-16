const express = require('express');
const { createBooking, getBookings, updateBookingStatus } = require('../controllers/bookingController');
const { auth, isAdmin } = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, createBooking);
router.get('/', auth, getBookings);
router.put('/:id', auth, isAdmin, updateBookingStatus);

module.exports = router;
