const Booking = require('../models/Booking');
const Center = require('../models/Center');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');
const mongoose = require('mongoose'); // <-- Added this

// Helper function to check if an ID is a valid MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// @desc    Create a booking (Citizen)
exports.createBooking = async (req, res) => {
  try {
    const { centerId, items, pickupDate, pickupAddress, notes, image } = req.body;

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
      image,
      status: 'pending',
    });

    await booking.save();

    // Send "Pickup Requested" email
    const userObj = await User.findById(req.user.id);
    if (userObj) {
      await sendEmail(
        userObj.email,
        '🌱 Pickup Requested - VD Collect',
        `<h2>Hi ${userObj.name},</h2>
         <p>Your pickup request has been received and is currently <b>pending</b>.</p>
         <p>We will notify you once a collector is assigned!</p>
         <p>Thank you for recycling with VD Collect.</p>`
      );
    }

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
        await sendEmail(
          user.email,
          '✅ Pickup Confirmed - VD Collect',
          `<h2>Good news, ${user.name}!</h2>
           <p>Your pickup for <b>${center.name}</b> has been confirmed.</p>
           <p>A collector has been assigned and will arrive on ${new Date(booking.pickupDate).toLocaleDateString()}.</p>`
        );
      }
    }

    // Award points when status changes to 'completed'
    if (status === 'completed') {
      const user = await User.findById(booking.user);
      if (user) {
        let earnedPoints = 0;
        booking.items.forEach(item => {
          earnedPoints += (item.quantity || 1) * 50; // 50 points per item
        });
        user.points = (user.points || 0) + earnedPoints;
        
        let newBadge = null;
        // Example badge logic: if they hit 500 points, give a badge
        if (user.points >= 500 && !user.badges.includes('Eco Warrior')) {
          user.badges.push('Eco Warrior');
          newBadge = 'Eco Warrior';
        }
        
        await user.save();

        // Send "Completed & Points Awarded" email
        await sendEmail(
          user.email,
          '🎉 Pickup Completed! You earned points!',
          `<h2>Thank you for recycling, ${user.name}!</h2>
           <p>Your pickup was successful. You just earned <b>${earnedPoints} Eco Points</b>!</p>
           ${newBadge ? `<p>🏆 You also unlocked a new badge: <b>${newBadge}</b>!</p>` : ''}
           <p>Check out your new stats on your Impact Dashboard.</p>`
        );
      }
    }

    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    console.error('❌ Update Status Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign a collector to a booking (Admin only)
exports.assignCollector = async (req, res) => {
  try {
    const { collectorId } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    booking.collector = collectorId;
    await booking.save();
    
    res.json({ message: 'Collector assigned successfully', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get assignments for the logged-in collector
exports.getCollectorAssignments = async (req, res) => {
  try {
    const bookings = await Booking.find({ collector: req.user.id })
      .populate('user', 'name email phone')
      .populate('center', 'name address')
      .sort({ pickupDate: 1 });
      
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};