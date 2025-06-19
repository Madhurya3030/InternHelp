const express = require('express');
const router = express.Router();
const { updateProfile, getProfile, getAllUsers, editProfileAllowedFields } = require('../controllers/userController');

router.post('/profile', updateProfile);
router.get('/profile', getProfile);
router.get('/users', getAllUsers);

// New route for editing profile with allowed fields only
router.put('/edit-profile/:username', editProfileAllowedFields);

module.exports = router;
