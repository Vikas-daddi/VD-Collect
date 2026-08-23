const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

const isAdminOrCollector = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'collector')) {
    next();
  } else {
    res.status(403).json({ message: 'Admin or Collector access required' });
  }
};

module.exports = { auth, isAdmin, isAdminOrCollector };
