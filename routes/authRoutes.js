const express = require('express');
const { body, validationResult } = require('express-validator');
const { register, login, getMe, getCollectors } = require('../controllers/authController');
const { auth, isAdmin } = require('../middleware/auth');
const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(e => e.msg).join(', ');
    return res.status(400).json({ message: errorMessages, errors: errors.array() });
  }
  next();
};

router.post('/register', [
  body('name').isString().bail().trim().notEmpty().withMessage('Name is required'),
  body('email').isString().bail().trim().isEmail().withMessage('Valid email is required'),
  body('password').isString().bail().notEmpty().withMessage('Password is required'),
  validate
], register);

router.post('/login', [
  body('email').isString().bail().trim().isEmail().withMessage('Valid email is required'),
  body('password').isString().bail().notEmpty().withMessage('Password is required'),
  validate
], login);

router.get('/me', auth, getMe);
router.get('/collectors', auth, isAdmin, getCollectors);

module.exports = router;
