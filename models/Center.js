const mongoose = require('mongoose');

const CenterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  phone: { type: String },
  email: { type: String },
  acceptedItems: { type: [String], default: ['Laptops', 'Mobile Phones', 'Batteries', 'Chargers', 'TVs'] },
  timing: { type: String, default: '9:00 AM - 6:00 PM' },
  isActive: { type: Boolean, default: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Center', CenterSchema);
