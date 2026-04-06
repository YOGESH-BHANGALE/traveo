const Auto = require('../models/Auto');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Haversine distance in meters
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Driver: go online and start an auto session
 * POST /api/auto/start
 */
const startAuto = async (req, res) => {
  try {
    const {
      sourceLat, sourceLng, sourceAddress,
      destLat, destLng, destAddress,
      totalSeats, farePerSeat,
      vehicleNumber, vehicleModel,
      boardingMinutes = 5,
    } = req.body;

    if (!sourceLat || !sourceLng || !destLat || !destLng) {
      return res.status(400).json({ success: false, message: 'Source and destination coordinates required' });
    }

    // End any existing active session for this driver
    await Auto.updateMany(
      { driver: req.user._id, status: { $in: ['online', 'boarding'] } },
      { status: 'offline' }
    );

    const boardingDeadline = new Date(Date.now() + (boardingMinutes || 5) * 60 * 1000);

    const auto = await Auto.create({
      driver: req.user._id,
      route: {
        source: { address: sourceAddress || '', lat: parseFloat(sourceLat), lng: parseFloat(sourceLng) },
        destination: { address: destAddress || '', lat: parseFloat(destLat), lng: parseFloat(destLng) },
      },
      totalSeats: parseInt(totalSeats) || 3,
      farePerSeat: parseFloat(farePerSeat) || 0,
      vehicleNumber: vehicleNumber || '',
      vehicleModel: vehicleModel || '',
      boardingDeadline,
      currentLocation: { lat: parseFloat(sourceLat), lng: parseFloat(sourceLng), updatedAt: new Date() },
      status: 'online',
    });

    await auto.populate('driver', 'name profilePhoto rating phone');

    // Broadcast to nearby riders via socket
    const io = req.app.get('io');
    if (io) io.emit('auto_online', { auto });

    res.status(201).json({ success: true, auto });
  } catch (error) {
    console.error('Start auto error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Driver: go offline
 * PUT /api/auto/:autoId/offline
 */
const goOffline = async (req, res) => {
  try {
    const auto = await Auto.findById(req.params.autoId);
    if (!auto) return res.status(404).json({ success: false, message: 'Auto not found' });
    if (auto.driver.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    auto.status = 'offline';
    await auto.save();

    const io = req.app.get('io');
    if (io) io.emit('auto_offline', { autoId: auto._id });

    res.json({ success: true, message: 'Gone offline' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Driver: depart (start the ride)
 * PUT /api/auto/:autoId/depart
 */
const departAuto = async (req, res) => {
  try {
    const auto = await Auto.findById(req.params.autoId).populate('bookings');
    if (!auto) return res.status(404).json({ success: false, message: 'Auto not found' });
    if (auto.driver.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    auto.status = 'in_progress';
    auto.departureTime = new Date();
    await auto.save();

    const io = req.app.get('io');
    if (io) io.to(`auto:${auto._id}`).emit('auto_departed', { autoId: auto._id });

    res.json({ success: true, auto });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Driver: complete the auto ride
 * PUT /api/auto/:autoId/complete
 */
const completeAuto = async (req, res) => {
  try {
    const auto = await Auto.findById(req.params.autoId);
    if (!auto) return res.status(404).json({ success: false, message: 'Auto not found' });
    if (auto.driver.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    auto.status = 'completed';
    auto.completedAt = new Date();
    await auto.save();

    // Mark all confirmed bookings as completed
    await Booking.updateMany({ auto: auto._id, status: 'confirmed' }, { status: 'completed' });

    // Increment driver totalTrips
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalTrips: 1 } });

    const io = req.app.get('io');
    if (io) io.to(`auto:${auto._id}`).emit('auto_completed', { autoId: auto._id });

    res.json({ success: true, auto });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Rider: get nearby online autos within radius
 * GET /api/auto/nearby?lat=&lng=&radius=2000
 */
const getNearbyAutos = async (req, res) => {
  try {
    const { lat, lng, radius = 2000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng required' });

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radius);

    const autos = await Auto.find({ status: { $in: ['online', 'boarding'] }, availableSeats: { $gte: 1 } })
      .populate('driver', 'name profilePhoto rating phone')
      .sort({ createdAt: -1 })
      .limit(50);

    const nearby = autos.filter((a) => {
      const dist = haversine(userLat, userLng, a.route.source.lat, a.route.source.lng);
      return dist <= maxRadius;
    });

    res.json({ success: true, count: nearby.length, autos: nearby });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get single auto details
 * GET /api/auto/:autoId
 */
const getAuto = async (req, res) => {
  try {
    const auto = await Auto.findById(req.params.autoId)
      .populate('driver', 'name profilePhoto rating phone')
      .populate({ path: 'bookings', populate: { path: 'rider', select: 'name profilePhoto rating' } });

    if (!auto) return res.status(404).json({ success: false, message: 'Auto not found' });
    res.json({ success: true, auto });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Rider: book a seat
 * POST /api/auto/:autoId/book
 */
const bookSeat = async (req, res) => {
  try {
    const { seatNumber, pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress } = req.body;
    const auto = await Auto.findById(req.params.autoId);

    if (!auto) return res.status(404).json({ success: false, message: 'Auto not found' });
    if (!['online', 'boarding'].includes(auto.status))
      return res.status(400).json({ success: false, message: 'Auto is not accepting bookings' });
    if (auto.availableSeats < 1)
      return res.status(400).json({ success: false, message: 'No seats available' });
    if (auto.driver.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'Driver cannot book their own auto' });

    // Check seat not already taken
    const existing = await Booking.findOne({ auto: auto._id, seatNumber, status: { $ne: 'cancelled' } });
    if (existing) return res.status(400).json({ success: false, message: `Seat ${seatNumber} is already booked` });

    // Check user hasn't already booked this auto
    const alreadyBooked = await Booking.findOne({ auto: auto._id, rider: req.user._id, status: { $ne: 'cancelled' } });
    if (alreadyBooked) return res.status(400).json({ success: false, message: 'You already have a booking on this auto' });

    const booking = await Booking.create({
      auto: auto._id,
      rider: req.user._id,
      seatNumber,
      pickupLocation: { address: pickupAddress || '', lat: pickupLat || null, lng: pickupLng || null },
      dropLocation: { address: dropAddress || '', lat: dropLat || null, lng: dropLng || null },
      fare: auto.farePerSeat,
      rideType: 'live',
    });

    // Decrement available seats
    auto.availableSeats = Math.max(0, auto.availableSeats - 1);
    auto.status = 'boarding';
    auto.bookings.push(booking._id);
    await auto.save();

    await booking.populate('rider', 'name profilePhoto rating phone');

    const io = req.app.get('io');
    if (io) {
      // Notify driver
      io.to(`user:${auto.driver}`).emit('seat_booked', { booking, autoId: auto._id, availableSeats: auto.availableSeats });
      // Broadcast updated seat map to all in auto room
      io.to(`auto:${auto._id}`).emit('seat_map_update', { autoId: auto._id, availableSeats: auto.availableSeats });
    }

    res.status(201).json({ success: true, booking, auto: { availableSeats: auto.availableSeats, status: auto.status } });
  } catch (error) {
    console.error('Book seat error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Rider: cancel booking
 * PUT /api/auto/booking/:bookingId/cancel
 */
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.rider.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (['completed', 'cancelled'].includes(booking.status))
      return res.status(400).json({ success: false, message: 'Cannot cancel this booking' });

    booking.status = 'cancelled';
    await booking.save();

    // Restore seat
    await Auto.findByIdAndUpdate(booking.auto, { $inc: { availableSeats: 1 } });

    const io = req.app.get('io');
    if (io) {
      const auto = await Auto.findById(booking.auto);
      if (auto) {
        io.to(`user:${auto.driver}`).emit('booking_cancelled', { bookingId: booking._id, autoId: auto._id });
        io.to(`auto:${auto._id}`).emit('seat_map_update', { autoId: auto._id, availableSeats: auto.availableSeats });
      }
    }

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get driver's active auto session
 * GET /api/auto/driver/active
 */
const getDriverActiveAuto = async (req, res) => {
  try {
    const auto = await Auto.findOne({
      driver: req.user._id,
      status: { $in: ['online', 'boarding', 'in_progress'] },
    })
      .populate('driver', 'name profilePhoto rating phone')
      .populate({ path: 'bookings', populate: { path: 'rider', select: 'name profilePhoto rating phone' } });

    res.json({ success: true, auto: auto || null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get rider's bookings
 * GET /api/auto/my/bookings
 */
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ rider: req.user._id })
      .populate({
        path: 'auto',
        populate: { path: 'driver', select: 'name profilePhoto rating phone' },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  startAuto, goOffline, departAuto, completeAuto,
  getNearbyAutos, getAuto, bookSeat, cancelBooking,
  getDriverActiveAuto, getMyBookings,
};
