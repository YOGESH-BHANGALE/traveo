const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getPublicProfile,
  reportUser,
  subscribePush,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All user routes are protected
router.use(protect);

// Get own profile
router.get('/profile', getProfile);

// Update own profile
router.put('/profile', updateProfile);

// Subscribe to push notifications
router.post('/subscribe', subscribePush);

// Get public profile
router.get('/:userId', getPublicProfile);

// Report a user
router.post('/:userId/report', reportUser);

module.exports = router;
