const express = require('express');
const router = express.Router();
const {
  startAuto, goOffline, departAuto, completeAuto,
  getNearbyAutos, getAuto, bookSeat, cancelBooking,
  getDriverActiveAuto, getMyBookings,
} = require('../controllers/autoController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/start', startAuto);
router.get('/nearby', getNearbyAutos);
router.get('/driver/active', getDriverActiveAuto);
router.get('/my/bookings', getMyBookings);
router.get('/:autoId', getAuto);
router.put('/:autoId/offline', goOffline);
router.put('/:autoId/depart', departAuto);
router.put('/:autoId/complete', completeAuto);
router.post('/:autoId/book', bookSeat);
router.put('/booking/:bookingId/cancel', cancelBooking);

module.exports = router;
