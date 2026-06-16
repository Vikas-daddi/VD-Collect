const express = require('express');
const { getCenters, addCenter, deleteCenter, updateCenter } = require('../controllers/centerController');
const { auth, isAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', getCenters);
router.post('/', auth, isAdmin, addCenter);
router.put('/:id', auth, isAdmin, updateCenter); // <-- NEW: Update route
router.delete('/:id', auth, isAdmin, deleteCenter);

module.exports = router;