const Center = require('../models/Center');

exports.getCenters = async (req, res) => {
  try {
    const centers = await Center.find({ isActive: true });
    res.json(centers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addCenter = async (req, res) => {
  try {
    const { name, address, city, pincode, latitude, longitude, phone, email, acceptedItems, timing } = req.body;
    const center = new Center({
      name, address, city, pincode, latitude, longitude, phone, email, acceptedItems, timing,
      addedBy: req.user.id,
    });
    await center.save();
    res.status(201).json({ message: 'Center added successfully', center });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCenter = async (req, res) => {
  try {
    const center = await Center.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ message: 'Center not found' });
    }
    await center.deleteOne();
    res.json({ message: 'Center deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Update a center (Admin only)
exports.updateCenter = async (req, res) => {
  try {
    const { name, address, city, pincode, latitude, longitude, phone, email, acceptedItems, timing, isActive } = req.body;

    const center = await Center.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ message: 'Center not found' });
    }

    // Update fields
    center.name = name || center.name;
    center.address = address || center.address;
    center.city = city || center.city;
    center.pincode = pincode || center.pincode;
    center.latitude = latitude || center.latitude;
    center.longitude = longitude || center.longitude;
    center.phone = phone || center.phone;
    center.email = email || center.email;
    center.acceptedItems = acceptedItems || center.acceptedItems;
    center.timing = timing || center.timing;
    if (typeof isActive !== 'undefined') center.isActive = isActive;

    await center.save();
    res.json({ message: 'Center updated successfully', center });
  } catch (error) {
    console.error('Update center error:', error);
    res.status(500).json({ message: error.message });
  }
};