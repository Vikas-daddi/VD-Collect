const express = require('express');
const { getCenters, addCenter, deleteCenter, updateCenter } = require('../controllers/centerController');
const { auth, isAdmin } = require('../middleware/auth');
const router = express.Router();
const { id, center } = require('../middleware/validation');

router.get('/', getCenters);
router.post('/', auth, isAdmin, center(), addCenter);
router.put('/:id', auth, isAdmin, id, center(true), updateCenter);
router.delete('/:id', auth, isAdmin, id, deleteCenter);

module.exports = router;
