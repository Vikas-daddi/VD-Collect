const { body, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array().map(e => e.msg).join(', '), errors: errors.array() });
  }
  next();
};

const id = [param('id').isMongoId().withMessage('Invalid resource ID'), validate];
const booking = [
  body('centerId').isMongoId().withMessage('Select a valid collection center'),
  body('items').isArray({ min: 1, max: 100 }).withMessage('Provide 1 to 100 items'),
  body('items.*.name').isString().bail().trim().notEmpty().withMessage('Item name is required'),
  body('items.*.quantity').isInt({ min: 1, max: 10000 }).withMessage('Quantity must be a positive integer'),
  body('pickupAddress').isString().bail().trim().notEmpty().withMessage('Pickup address is required'),
  body('pickupDate').isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage('Provide a valid pickup date')
    .bail().custom(value => {
      // Date-only bookings use the service timezone, matching the calendar in India.
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      return value >= today;
    }).withMessage('Pickup date cannot be in the past'),
  body('image').optional({ nullable: true }).isString().bail()
    .matches(/^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/)
    .withMessage('Image must be a PNG, JPEG, GIF or WebP data URL'),
  validate,
];

const center = (partial = false) => [
  ...['name', 'address', 'city'].map(field => {
    const rule = body(field);
    return (partial ? rule.optional() : rule).isString().bail().trim().notEmpty().withMessage(`${field} is required`);
  }),
  (partial ? body('latitude').optional() : body('latitude')).isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  (partial ? body('longitude').optional() : body('longitude')).isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('acceptedItems').optional().isArray().withMessage('Accepted items must be an array'),
  body('acceptedItems.*').isString().withMessage('Accepted items must be text'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('Active must be a boolean'),
  validate,
];

module.exports = { validate, id, booking, center };
