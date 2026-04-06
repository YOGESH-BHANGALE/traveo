const express = require('express');
const router = express.Router();
const {
  createTrip,
  searchTrips,
  getTripMatches,
  getMySentRequests,
  getMyTrips,
  getTrip,
  cancelTrip,
  requestConnect,
  bookSeats,
  cancelBooking,
  startTrip,
  closeTrip,
  updateDriverSettings,
  getTripBookings,
  createTripValidation,
} = require('../controllers/tripController');
const { protect } = require('../middleware/auth');

// All trip routes are protected
router.use(protect);

// Create a trip
router.post('/', createTripValidation, createTrip);

// Search trips
router.get('/search', searchTrips);

// Get user's sent connection requests (for users without own trip)
router.get('/my/requests', getMySentRequests);

// Get user's trips
router.get('/my', getMyTrips);

// Get single trip
router.get('/:tripId', getTrip);

// Get matches for a trip
router.get('/:tripId/matches', getTripMatches);

// Get bookings for a trip (driver only)
router.get('/:tripId/bookings', getTripBookings);

// Cancel a trip
router.put('/:tripId/cancel', cancelTrip);

// Request to connect with a trip
router.post('/:tripId/connect', requestConnect);

// Book seats on a trip (flexible booking)
router.post('/:tripId/book', bookSeats);

// Cancel a booking
router.post('/:tripId/cancel-booking', cancelBooking);

// Start trip (driver decision)
router.post('/:tripId/start', startTrip);

// Close trip manually (driver decision)
router.post('/:tripId/close', closeTrip);

// Update driver decision settings
router.put('/:tripId/driver-settings', updateDriverSettings);

module.exports = router;
