const CenterRequest = require('../models/CenterRequest');

exports.createRequest = async (req, res) => {
  try {
    const { location } = req.body;
    if (!location) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const newRequest = new CenterRequest({
      user: req.user.id,
      location,
    });

    await newRequest.save();
    res.status(201).json({ message: 'Request submitted successfully', request: newRequest });
  } catch (error) {
    console.error('Error creating request:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const requests = await CenterRequest.find().populate('user', 'name email phone').sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await CenterRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    await request.save();
    res.json({ message: 'Request status updated', request });
  } catch (error) {
    console.error('Error updating request status:', error.message);
    res.status(500).json({ message: error.message });
  }
};
