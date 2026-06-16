const Booking = require('../models/Booking');
const Center = require('../models/Center');
const User = require('../models/User');
const { sendBookingConfirmation } = require('../config/email');
const mongoose = require('mongoose'); // <-- Added this

// Helper function to check if an ID is a valid MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// @desc    Create a booking (Citizen)
exports.createBooking = async (req, res) => {
  try {
    const { centerId, items, pickupDate, pickupAddress, notes } = req.body;

    // 🔥 FIX: Check if centerId is a valid ObjectId BEFORE querying
    let center = null;
    if (isValidObjectId(centerId)) {
      center = await Center.findById(centerId);
    }

    // If not found in DB, check if it's a dummy center (fallback)
    if (!center) {
      // Allow booking even if center is dummy? 
      // Better: Send a clear message, OR store dummy booking without DB relation.
      // Since we want to test, let's just return a specific message.
      return res.status(400).json({ 
        message: 'Invalid center selected. Please select a center added by the Admin (not dummy).' 
      });
    }

    const booking = new Booking({
      user: req.user.id,
      center: centerId,
      items,
      pickupDate,
      pickupAddress,
      notes,
      status: 'pending',
    });

    await booking.save();
    res.status(201).json({ message: 'Pickup booked successfully', booking });

  } catch (error) {
    console.error('❌ Booking Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings (Admin) or user bookings (Citizen)
exports.getBookings = async (req, res) => {
  try {
    let bookings;
    if (req.user.role === 'admin') {
      bookings = await Booking.find()
        .populate('user', 'name email phone')
        .populate('center', 'name city address');
    } else {
      bookings = await Booking.find({ user: req.user.id })
        .populate('center', 'name city address');
    }

    // 🔥 FIX: If center is null (deleted or dummy), show "Unknown Center"
    const formattedBookings = bookings.map(b => {
      const booking = b.toObject();
      if (!booking.center) {
        booking.center = { name: 'Unknown Center (Deleted)', city: 'N/A', address: 'N/A' };
      }
      return booking;
    });

    res.json(formattedBookings);
  } catch (error) {
    console.error('Get Bookings Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status (Admin only) + SEND EMAIL if confirmed
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    booking.status = status;
    await booking.save();

    // Send email when status changes to 'confirmed'
    if (status === 'confirmed') {
      const user = await User.findById(booking.user);
      const center = await Center.findById(booking.center);
      if (user && center) {
        await sendBookingConfirmation(user.email, user.name, center.name, booking.pickupDate);
      }
    }

    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    console.error('❌ Update Status Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};