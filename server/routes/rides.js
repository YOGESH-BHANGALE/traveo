const express = require('express');
const router = express.Router();
const {
  acceptRide,
  rejectRide,
  getRide,
  getMyRides,
  startRide,
  completeRide,
  rateRide,
} = require('../controllers/rideController');
const { protect } = require('../middleware/auth');

// All ride routes are protected
router.use(protect);

// Accept a ride match
router.post('/accept', acceptRide);

// Reject a ride match
router.post('/reject', rejectRide);

// Get user's rides
router.get('/my', getMyRides);

// Get ride details
router.get('/:rideId', getRide);

// Start a ride
router.put('/:rideId/start', startRide);

// Complete a ride
router.put('/:rideId/complete', completeRide);

// Rate a ride companion
router.post('/:rideId/rate', rateRide);

module.exports = router;
