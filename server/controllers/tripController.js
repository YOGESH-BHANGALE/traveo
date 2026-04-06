const Trip = require('../models/Trip');
const Match = require('../models/Match');
const { findMatches, getMatchesForTrip, haversineDistance, calculateMatchScore } = require('../services/matchingService');
const { calculateFare } = require('../services/costService');
const { body, validationResult } = require('express-validator');

// Validation rules
const createTripValidation = [
  body('source.address').notEmpty().withMessage('Source address is required'),
  body('source.lat').isNumeric().withMessage('Source latitude is required'),
  body('source.lng').isNumeric().withMessage('Source longitude is required'),
  body('destination.address').notEmpty().withMessage('Destination address is required'),
  body('destination.lat').isNumeric().withMessage('Destination latitude is required'),
  body('destination.lng').isNumeric().withMessage('Destination longitude is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('seats').optional().isInt({ min: 1, max: 6 }),
];

/**
 * Create a new trip
 * POST /api/trips
 */
const createTrip = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      source,
      destination,
      date,
      time,
      seats,
      vehicleType,
      notes,
      estimatedDistance,
      estimatedDuration,
      estimatedFare: fareFromClient,
    } = req.body;

    // Use user-provided fare if given, otherwise calculate from distance/duration
    const estimatedFare = fareFromClient
      ? Number(fareFromClient)
      : calculateFare(estimatedDistance || 0, estimatedDuration || 0, vehicleType || 'any');

    // Validate trip is not in the past
    const tripDateTime = new Date(`${date}T${time}`);
    if (tripDateTime < new Date()) {
      return res.status(400).json({ success: false, message: 'Trip date and time cannot be in the past' });
    }

    // Validate source and destination are not the same
    if (source.lat && destination.lat) {
      const dLat = Math.abs(source.lat - destination.lat);
      const dLng = Math.abs(source.lng - destination.lng);
      if (dLat < 0.001 && dLng < 0.001) {
        return res.status(400).json({ success: false, message: 'Pickup and destination cannot be the same location' });
      }
    }

    const seatCount = seats || 1;
    const trip = await Trip.create({
      user: req.user._id,
      source: {
        address: source.address,
        lat: source.lat,
        lng: source.lng,
        placeId: source.placeId || '',
        landmark: source.landmark || '',
        area: source.area || '',
        region: source.region || '',
        pincode: source.pincode || '',
      },
      destination: {
        address: destination.address,
        lat: destination.lat,
        lng: destination.lng,
        placeId: destination.placeId || '',
        landmark: destination.landmark || '',
        area: destination.area || '',
        region: destination.region || '',
        pincode: destination.pincode || '',
      },
      date,
      time,
      seats: seatCount,
      availableSeats: seatCount, // BUG FIX: was never set, causing all trips to be filtered out
      vehicleType: vehicleType || 'any',
      notes: notes || '',
      estimatedDistance: estimatedDistance || 0,
      estimatedDuration: estimatedDuration || 0,
      estimatedFare,
    });

    // Populate user data
    await trip.populate('user', 'name email profilePhoto rating role');

    // Trigger matching in background
    findMatches(trip._id).catch((err) =>
      console.error('Matching error:', err.message)
    );

    // Emit real-time event so nearby users see the new trip instantly
    // Rule: driver-posted trips only go to riders; rider-posted trips go to everyone
    const io = req.app.get('io');
    if (io) {
      io.emit('trip_nearby', { trip, posterRole: req.user.role || 'user' });
    }

    res.status(201).json({
      success: true,
      trip,
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating trip',
    });
  }
};

/**
 * Search for trips
 * GET /api/trips/search
 */
const searchTrips = async (req, res) => {
  try {
    const { userLat, userLng, date, radius = 2500 } = req.query; // 2.5 km radius

    const query = {
      status: { $in: ['open', 'partially_filled'] }, // Only show trips with available seats
      availableSeats: { $gte: 1 },
      closedManually: false, // Exclude manually closed trips
    };

    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(searchDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // Location is required — without it we don't show any trips
    if (!userLat || !userLng) {
      return res.json({ success: true, count: 0, trips: [] });
    }

    const lat = parseFloat(userLat);
    const lng = parseFloat(userLng);
    const maxRadius = parseFloat(radius) || 2500;

    let trips = await Trip.find(query)
      .populate('user', 'name email profilePhoto rating role')
      .sort({ createdAt: -1 })
      .limit(200);

    // Filter by proximity to user's current location (source pickup within radius)
    const R = 6371000;
    trips = trips.filter((trip) => {
      const dLat = ((trip.source.lat - lat) * Math.PI) / 180;
      const dLng = ((trip.source.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((trip.source.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return distance <= maxRadius;
    });


    // Exclude the requesting user's own trips
    if (req.user) {
      trips = trips.filter(
        (trip) => trip.user._id.toString() !== req.user._id.toString()
      );
    }

    // Exclude trips whose poster already has an active or completed ride with the requesting user
    if (req.user) {
      const existingRides = await require('../models/Ride').find({
        'users.user': req.user._id,
        status: { $in: ['confirmed', 'in_progress', 'completed'] },
      }).select('users');

      const ridePartnerIds = new Set();
      existingRides.forEach((ride) => {
        ride.users.forEach((u) => {
          const uid = u.user.toString();
          if (uid !== req.user._id.toString()) ridePartnerIds.add(uid);
        });
      });

      if (ridePartnerIds.size > 0) {
        trips = trips.filter(
          (trip) => !ridePartnerIds.has(trip.user._id.toString())
        );
      }
    }

    // Visibility rules:
    // - Trip posted by a DRIVER → only riders (role: 'user') can see it
    // - Trip posted by a RIDER  → everyone (riders + drivers) can see it
    const viewerRole = req.user?.role || 'user';
    if (viewerRole === 'driver') {
      // Drivers can only see trips posted by riders
      trips = trips.filter((trip) => trip.user.role !== 'driver');
    }

    res.json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error('Search trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching trips',
    });
  }
};

/**
 * Get matches for a trip
 * GET /api/trips/:tripId/matches
 */
const getTripMatches = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Allow trip owner OR any user who sent a connection request to this trip
    if (trip.user.toString() !== req.user._id.toString()) {
      const hasMatch = await Match.findOne({
        trip: tripId,
        matchedUser: req.user._id,
      });
      if (!hasMatch) {
        return res.status(403).json({ success: false, message: 'Not authorized to view matches for this trip' });
      }
    }

    // Return all matches for this trip (owner sees all; passenger sees only their own)
    const isOwner = trip.user.toString() === req.user._id.toString();
    const query = isOwner
      ? { trip: tripId }
      : { trip: tripId, matchedUser: req.user._id };

    const matches = await Match.find(query)
      .populate({ path: 'trip', populate: { path: 'user', select: 'name email profilePhoto rating phone role' } })
      .populate({ path: 'matchedTrip', populate: { path: 'user', select: 'name email profilePhoto rating role' } })
      .populate('matchedUser', 'name email profilePhoto rating role')
      .populate('requestedBy', 'name email profilePhoto')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching matches' });
  }
};

/**
 * Get matches/requests sent by this user (as requester, no own trip needed)
 * GET /api/trips/my/requests
 */
const getMySentRequests = async (req, res) => {
  try {
    const matches = await Match.find({ requestedBy: req.user._id })
      .populate({
        path: 'trip',
        populate: { path: 'user', select: 'name email profilePhoto rating phone role' },
      })
      .populate({
        path: 'matchedTrip',
        populate: { path: 'user', select: 'name email profilePhoto rating role' },
      })
      .populate('matchedUser', 'name email profilePhoto rating role')
      .populate('requestedBy', 'name email profilePhoto')
      .sort({ createdAt: -1 });

    // For accepted matches, attach the rideId so the passenger can navigate to chat
    const Ride = require('../models/Ride');
    const matchesWithRide = await Promise.all(
      matches.map(async (match) => {
        const m = match.toObject();
        if (match.status === 'accepted') {
          // Find the ride that contains BOTH the requester and the trip owner
          const tripOwnerId = match.trip?.user?._id || match.trip?.user;
          const ride = await Ride.findOne({
            'users.user': { $all: [req.user._id, tripOwnerId] },
          })
            .select('_id status')
            .sort({ createdAt: -1 });
          if (ride) m.rideId = ride._id;
        }
        return m;
      })
    );

    res.json({ success: true, count: matchesWithRide.length, matches: matchesWithRide });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get user's trips
 * GET /api/trips/my
 */
const getMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email profilePhoto rating role');

    res.json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error('Get my trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Get single trip
 * GET /api/trips/:tripId
 */
const getTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate(
      'user',
      'name email profilePhoto rating phone role'
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    res.json({
      success: true,
      trip,
    });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Cancel a trip
 * PUT /api/trips/:tripId/cancel
 */
const cancelTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    trip.status = 'cancelled';
    await trip.save();

    res.json({
      success: true,
      trip,
    });
  } catch (error) {
    console.error('Cancel trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Request to connect with a trip — no own trip required
 * POST /api/trips/:tripId/connect
 */
const requestConnect = async (req, res) => {
  try {
    const { tripId } = req.params;

    const targetTrip = await Trip.findById(tripId).populate('user');
    if (!targetTrip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (targetTrip.user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot connect with your own trip' });
    }

    // Visibility rule: driver-posted trips are only visible to riders
    const tripPosterRole = targetTrip.user.role || 'user';
    const requesterRole = req.user.role || 'user';
    if (tripPosterRole === 'driver' && requesterRole === 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Drivers cannot connect to trips posted by other drivers',
      });
    }

    // Check if trip is available for booking
    const validStatuses = ['open', 'partially_filled'];
    if (!validStatuses.includes(targetTrip.status)) {
      return res.status(400).json({ success: false, message: 'Trip is no longer available for booking' });
    }

    if (targetTrip.closedManually) {
      return res.status(400).json({ success: false, message: 'Trip has been closed by the driver' });
    }

    if ((targetTrip.availableSeats ?? targetTrip.seats) < 1) {
      return res.status(400).json({ success: false, message: 'No seats available on this trip' });
    }

    // Check if a request already exists from this user for this trip
    const existingMatch = await Match.findOne({
      trip: targetTrip._id,
      matchedUser: req.user._id,
    });

    if (existingMatch) {
      return res.status(400).json({ success: false, message: 'A connection request already exists', match: existingMatch });
    }

    // Try to find requester's own active trip for score calculation (optional)
    const myTrip = await Trip.findOne({ user: req.user._id, status: 'active' }).sort({ createdAt: -1 });

    let matchScore = 50; // default score when no own trip
    let distanceDiff = 0;
    let timeDiff = 0;
    let matchedTripId = null; // no own trip — passenger connecting directly

    if (myTrip) {
      const destDistance = haversineDistance(
        myTrip.destination.lat, myTrip.destination.lng,
        targetTrip.destination.lat, targetTrip.destination.lng
      );
      const sourceDistance = haversineDistance(
        myTrip.source.lat, myTrip.source.lng,
        targetTrip.source.lat, targetTrip.source.lng
      );
      const [h1, m1] = myTrip.time.split(':').map(Number);
      const [h2, m2] = targetTrip.time.split(':').map(Number);
      timeDiff = Math.abs((h1 * 60 + m1) - (h2 * 60 + m2));
      matchScore = calculateMatchScore(destDistance, sourceDistance, timeDiff);
      distanceDiff = Math.round(destDistance);
      matchedTripId = myTrip._id;
    }

    const match = await Match.create({
      trip: targetTrip._id,
      matchedTrip: matchedTripId,
      matchedUser: req.user._id,
      requestedBy: req.user._id,
      matchScore,
      distanceDiff,
      timeDiff: Math.round(timeDiff),
    });

    await match.populate('matchedUser', 'name email profilePhoto rating role');

    // Notify the trip owner in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${targetTrip.user._id}`).emit('new_connection_request', {
        match,
        fromUser: { _id: req.user._id, name: req.user.name, profilePhoto: req.user.profilePhoto },
        tripId: targetTrip._id,
      });
    }

    res.status(201).json({ success: true, match, message: 'Connection request sent!' });
  } catch (error) {
    console.error('Request connect error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Book seats on a trip (flexible booking)
 * POST /api/trips/:tripId/book
 */
const bookSeats = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { seatsRequested = 1 } = req.body;

    if (seatsRequested < 1 || seatsRequested > 6) {
      return res.status(400).json({ success: false, message: 'Seats requested must be between 1 and 6' });
    }

    const trip = await Trip.findById(tripId).populate('user', 'name email role');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Cannot book own trip
    if (trip.user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot book your own trip' });
    }

    // Check if trip is open for booking
    if (!['open', 'partially_filled'].includes(trip.status)) {
      return res.status(400).json({ success: false, message: 'Trip is not available for booking' });
    }

    if (trip.closedManually) {
      return res.status(400).json({ success: false, message: 'Trip has been closed by the driver' });
    }

    // Check available seats
    if (trip.availableSeats < seatsRequested) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${trip.availableSeats} seat(s) available`,
        availableSeats: trip.availableSeats
      });
    }

    // Check if user already has a booking
    const existingBooking = trip.bookings.find(
      b => b.rider.toString() === req.user._id.toString() && b.status === 'confirmed'
    );

    if (existingBooking) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a booking on this trip',
        booking: existingBooking
      });
    }

    // Add booking
    trip.bookings.push({
      rider: req.user._id,
      seatsBooked: seatsRequested,
      status: 'confirmed',
      bookedAt: new Date(),
    });

    // Update seat counts
    trip.bookedSeats += seatsRequested;
    trip.availableSeats -= seatsRequested;

    await trip.save(); // Pre-save hook will update status
    await trip.populate('bookings.rider', 'name email profilePhoto rating role');

    // Notify driver in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${trip.user._id}`).emit('seat_booked', {
        trip: trip._id,
        rider: { _id: req.user._id, name: req.user.name, profilePhoto: req.user.profilePhoto },
        seatsBooked: seatsRequested,
        remainingSeats: trip.availableSeats,
        status: trip.status,
      });

      // Notify all riders if trip is now full
      if (trip.status === 'full') {
        io.emit('trip_full', { tripId: trip._id });
      }
    }

    res.json({ 
      success: true, 
      message: `${seatsRequested} seat(s) booked successfully!`,
      trip,
      booking: trip.bookings[trip.bookings.length - 1]
    });
  } catch (error) {
    console.error('Book seats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Cancel a booking
 * POST /api/trips/:tripId/cancel-booking
 */
const cancelBooking = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const booking = trip.bookings.find(
      b => b.rider.toString() === req.user._id.toString() && b.status === 'confirmed'
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'No active booking found' });
    }

    // Cannot cancel if trip already started
    if (['started', 'in_progress', 'completed'].includes(trip.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel booking after trip has started' });
    }

    // Update booking status
    booking.status = 'cancelled';

    // Restore seats
    trip.bookedSeats -= booking.seatsBooked;
    trip.availableSeats += booking.seatsBooked;

    await trip.save();
    await trip.populate('user', 'name email');

    // Notify driver
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${trip.user._id}`).emit('booking_cancelled', {
        trip: trip._id,
        rider: { _id: req.user._id, name: req.user.name },
        seatsFreed: booking.seatsBooked,
        remainingSeats: trip.availableSeats,
        status: trip.status,
      });
    }

    res.json({ 
      success: true, 
      message: 'Booking cancelled successfully',
      trip
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Driver starts trip (with partial or full seats)
 * POST /api/trips/:tripId/start
 */
const startTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId).populate('bookings.rider', 'name email profilePhoto phone');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Only trip owner can start
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the trip owner can start the trip' });
    }

    // Check if trip can be started
    if (['started', 'in_progress', 'completed', 'cancelled'].includes(trip.status)) {
      return res.status(400).json({ success: false, message: `Trip is already ${trip.status}` });
    }

    // Check if there are any bookings
    const confirmedBookings = trip.bookings.filter(b => b.status === 'confirmed');
    if (confirmedBookings.length === 0) {
      return res.status(400).json({ success: false, message: 'No confirmed bookings to start trip' });
    }

    // Check if driver allows partial start
    if (trip.bookedSeats < trip.seats && !trip.driverDecision?.canStartPartial) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot start trip with partial bookings. Wait for all seats to be filled or enable partial start.',
        bookedSeats: trip.bookedSeats,
        totalSeats: trip.seats
      });
    }

    trip.status = 'started';
    trip.closedManually = true;
    trip.closedAt = new Date();
    await trip.save();

    // Notify all riders
    const io = req.app.get('io');
    if (io) {
      confirmedBookings.forEach(booking => {
        io.to(`user:${booking.rider._id}`).emit('trip_started', {
          trip: trip._id,
          message: 'Your trip has started!',
          driver: { _id: trip.user, name: req.user.name },
        });
      });

      // Broadcast trip is no longer available
      io.emit('trip_unavailable', { tripId: trip._id });
    }

    res.json({ 
      success: true, 
      message: 'Trip started successfully!',
      trip
    });
  } catch (error) {
    console.error('Start trip error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Driver closes trip manually (without starting)
 * POST /api/trips/:tripId/close
 */
const closeTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Only trip owner can close
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the trip owner can close the trip' });
    }

    if (['started', 'in_progress', 'completed', 'cancelled'].includes(trip.status)) {
      return res.status(400).json({ success: false, message: `Cannot close trip that is ${trip.status}` });
    }

    trip.status = 'closed';
    trip.closedManually = true;
    trip.closedAt = new Date();
    await trip.save();

    // Notify all riders with bookings
    const io = req.app.get('io');
    if (io) {
      const confirmedBookings = trip.bookings.filter(b => b.status === 'confirmed');
      confirmedBookings.forEach(booking => {
        io.to(`user:${booking.rider}`).emit('trip_closed', {
          trip: trip._id,
          message: 'The trip has been closed by the driver',
        });
      });

      io.emit('trip_unavailable', { tripId: trip._id });
    }

    res.json({ 
      success: true, 
      message: 'Trip closed successfully',
      trip
    });
  } catch (error) {
    console.error('Close trip error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update driver decision settings
 * PUT /api/trips/:tripId/driver-settings
 */
const updateDriverSettings = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { canStartPartial, autoStartWhenFull, decisionDeadline } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Only trip owner can update settings
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the trip owner can update settings' });
    }

    if (canStartPartial !== undefined) {
      trip.driverDecision.canStartPartial = canStartPartial;
    }
    if (autoStartWhenFull !== undefined) {
      trip.driverDecision.autoStartWhenFull = autoStartWhenFull;
    }
    if (decisionDeadline) {
      trip.driverDecision.decisionDeadline = new Date(decisionDeadline);
    }

    await trip.save();

    res.json({ 
      success: true, 
      message: 'Driver settings updated',
      driverDecision: trip.driverDecision
    });
  } catch (error) {
    console.error('Update driver settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get trip bookings (for driver)
 * GET /api/trips/:tripId/bookings
 */
const getTripBookings = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId)
      .populate('bookings.rider', 'name email profilePhoto rating phone role')
      .populate('user', 'name email');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Only trip owner can view bookings
    if (trip.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the trip owner can view bookings' });
    }

    const confirmedBookings = trip.bookings.filter(b => b.status === 'confirmed');
    const cancelledBookings = trip.bookings.filter(b => b.status === 'cancelled');

    res.json({ 
      success: true, 
      trip: {
        _id: trip._id,
        status: trip.status,
        seats: trip.seats,
        bookedSeats: trip.bookedSeats,
        availableSeats: trip.availableSeats,
        source: trip.source,
        destination: trip.destination,
        date: trip.date,
        time: trip.time,
      },
      bookings: {
        confirmed: confirmedBookings,
        cancelled: cancelledBookings,
        total: trip.bookings.length,
      },
      driverDecision: trip.driverDecision,
    });
  } catch (error) {
    console.error('Get trip bookings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
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
};
