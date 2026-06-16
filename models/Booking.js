const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  center: { type: mongoose.Schema.Types.ObjectId, ref: 'Center', required: true },
  items: [{ name: String, quantity: Number }],
  pickupDate: { type: Date, required: true },
  pickupAddress: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', BookingSchema);
