const Match = require('../models/Match');
const Ride = require('../models/Ride');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { splitFare } = require('../services/costService');

/**
 * Accept a match / ride request
 * POST /api/rides/accept
 */
const acceptRide = async (req, res) => {
  try {
    const { matchId } = req.body;

    const match = await Match.findById(matchId)
      .populate('trip')
      .populate('matchedUser', 'name email profilePhoto rating role');

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    if (match.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Match has already been ${match.status}` });
    }

    // Only the trip owner can accept
    if (match.trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the trip owner can accept this request' });
    }

    match.status = 'accepted';
    match.respondedAt = new Date();
    await match.save();

    const ownerTrip = await Trip.findById(match.trip._id);
    const riderUserId = match.matchedUser._id || match.matchedUser;

    // Check if rider is already in a ride for this trip
    const existingRide = await Ride.findOne({
      trips: ownerTrip._id,
      'users.user': riderUserId,
      status: { $in: ['confirmed', 'in_progress'] },
    });
    
    if (existingRide) {
      return res.json({ 
        success: true, 
        ride: existingRide, 
        fareSplit: { farePerPerson: existingRide.farePerPerson },
        message: 'Rider already added to this trip'
      });
    }

    // Check if a ride already exists for this trip (with other riders)
    let ride = await Ride.findOne({
      trips: ownerTrip._id,
      status: { $in: ['confirmed', 'in_progress'] },
    });

    const totalFare = ownerTrip.estimatedFare || 0;

    if (ride) {
      // Add new rider to existing ride
      const newRiderCount = ride.users.length + 1;
      const fareSplit = splitFare(totalFare, newRiderCount);
      
      // Update fare for all existing users
      ride.users.forEach((u) => { u.fare = fareSplit.farePerPerson; });
      
      // Add new rider
      ride.users.push({
        user: riderUserId,
        role: 'joiner',
        fare: fareSplit.farePerPerson,
      });
      
      ride.farePerPerson = fareSplit.farePerPerson;
      ride.totalFare = totalFare;
      
      await ride.save();
      await ride.populate('users.user', 'name email profilePhoto rating phone role');
      await ride.populate('trips');
      
    } else {
      // Create new ride for this trip
      const rideUsers = [
        { user: ownerTrip.user, role: 'creator' },
        { user: riderUserId, role: 'joiner' },
      ];
      const fareSplit = splitFare(totalFare, rideUsers.length);
      rideUsers.forEach((u) => { u.fare = fareSplit.farePerPerson; });

      ride = await Ride.create({
        trips: [ownerTrip._id],
        users: rideUsers,
        totalFare,
        farePerPerson: fareSplit.farePerPerson,
      });

      await ride.populate('users.user', 'name email profilePhoto rating phone role');
      await ride.populate('trips');
    }

    // Update trip bookings and seats
    const existingBooking = ownerTrip.bookings.find(
      b => b.rider.toString() === riderUserId.toString()
    );
    
    if (!existingBooking) {
      if ((ownerTrip.availableSeats ?? ownerTrip.seats) > 0) {
        ownerTrip.availableSeats = (ownerTrip.availableSeats ?? ownerTrip.seats) - 1;
        ownerTrip.bookedSeats = (ownerTrip.bookedSeats || 0) + 1;
      }
      
      ownerTrip.bookings.push({
        rider: riderUserId,
        seatsBooked: 1,
        status: 'confirmed',
        bookedAt: new Date(),
      });
      
      await ownerTrip.save();
    }

    // Notify all users in the ride
    const io = req.app.get('io');
    if (io) {
      ride.users.forEach((u) => {
        io.to(`user:${u.user._id}`).emit('ride_confirmed', {
          ride,
          rideId: ride._id,
          message: 'Your ride has been confirmed!',
        });
      });
      io.to(`ride:${ride._id}`).emit('ride_confirmed', {
        ride,
        rideId: ride._id,
        message: 'Your ride has been confirmed!',
      });
    }

    res.json({ success: true, ride, fareSplit: { farePerPerson: ride.farePerPerson } });
  } catch (error) {
    console.error('Accept ride error:', error);
    res.status(500).json({ success: false, message: 'Server error accepting ride' });
  }
};

/**
 * Reject a match / ride request
 * POST /api/rides/reject
 */
const rejectRide = async (req, res) => {
  try {
    const { matchId } = req.body;

    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    if (match.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Match has already been ${match.status}`,
      });
    }

    match.status = 'rejected';
    match.respondedAt = new Date();
    await match.save();

    res.json({
      success: true,
      message: 'Ride request rejected',
    });
  } catch (error) {
    console.error('Reject ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting ride',
    });
  }
};

/**
 * Get ride details
 * GET /api/rides/:rideId
 */
const getRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate('users.user', 'name email profilePhoto rating phone role')
      .populate({
        path: 'trips',
        populate: { path: 'user', select: 'name email profilePhoto' },
      });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    // Check if user is part of this ride
    const isParticipant = ride.users.some(
      (u) => u.user._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ride',
      });
    }

    res.json({
      success: true,
      ride,
    });
  } catch (error) {
    console.error('Get ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Get user's rides
 * GET /api/rides/my
 */
const getMyRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      'users.user': req.user._id,
    })
      .populate('users.user', 'name email profilePhoto rating phone role')
      .populate({
        path: 'trips',
        populate: { path: 'user', select: 'name email profilePhoto' },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error('Get my rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Start a ride
 * PUT /api/rides/:rideId/start
 */
const startRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    const myEntry = ride.users.find((u) => u.user.toString() === req.user._id.toString());
    if (!myEntry) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (myEntry.role !== 'creator') {
      return res.status(403).json({ success: false, message: 'Only the trip poster can start the ride' });
    }

    if (ride.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: `Cannot start a ride with status: ${ride.status}` });
    }

    ride.status = 'in_progress';
    ride.startedAt = new Date();
    await ride.save();

    await ride.populate('users.user', 'name email profilePhoto rating role');

    // Notify all participants that ride has started
    const io = req.app.get('io');
    if (io) {
      ride.users.forEach((u) => {
        io.to(`user:${u.user._id}`).emit('ride_started', {
          rideId: ride._id.toString(),
          message: 'Ride has started!',
        });
      });
    }

    res.json({
      success: true,
      ride,
    });
  } catch (error) {
    console.error('Start ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Complete a ride
 * PUT /api/rides/:rideId/complete
 */
const completeRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    // Only participants can complete the ride
    const isParticipant = ride.users.some((u) => u.user.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (ride.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Ride is already completed' });
    }

    if (ride.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot complete a cancelled ride' });
    }

    if (ride.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Ride must be in progress before completing' });
    }

    ride.status = 'completed';
    ride.completedAt = new Date();
    await ride.save();

    // Update user total trips
    for (const u of ride.users) {
      await User.findByIdAndUpdate(u.user, { $inc: { totalTrips: 1 } });
    }

    // Update trip statuses — mark all trips by ride participants as completed
    for (const tripId of ride.trips) {
      await Trip.findByIdAndUpdate(tripId, { status: 'completed' });
    }
    // Also mark any remaining active trips by participants
    const participantIds = ride.users.map((u) => u.user);
    await Trip.updateMany(
      { user: { $in: participantIds }, status: { $in: ['open', 'partially_filled', 'full', 'started', 'in_progress'] } },
      { status: 'completed' }
    );

    await ride.populate('users.user', 'name email profilePhoto rating role');

    // Notify both users in real-time that ride is completed
    const io = req.app.get('io');
    if (io) {
      ride.users.forEach((u) => {
        io.to(`user:${u.user._id}`).emit('ride_completed', {
          rideId: ride._id.toString(),
          message: 'Ride completed!',
        });
      });
    }

    res.json({ success: true, ride });
  } catch (error) {
    console.error('Complete ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Rate a ride companion
 * POST /api/rides/:rideId/rate
 * Rule: only joiners can rate — the trip creator (poster) cannot rate anyone
 */
const rateRide = async (req, res) => {
  try {
    const { toUserId, score, comment } = req.body;
    const ride = await Ride.findById(req.params.rideId);

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    if (ride.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only rate completed rides' });
    }

    // Find the current user's role in this ride
    const myEntry = ride.users.find((u) => u.user.toString() === req.user._id.toString());
    if (!myEntry) {
      return res.status(403).json({ success: false, message: 'You are not a participant of this ride' });
    }

    // Only joiners can rate — the trip creator (poster) cannot rate
    if (myEntry.role === 'creator') {
      return res.status(403).json({ success: false, message: 'Trip creators cannot rate. Only users who joined the trip can rate.' });
    }

    // The target must be the creator (joiner rates the poster)
    const targetEntry = ride.users.find((u) => u.user.toString() === toUserId);
    if (!targetEntry) {
      return res.status(400).json({ success: false, message: 'Target user is not a participant of this ride' });
    }
    if (targetEntry.role !== 'creator') {
      return res.status(400).json({ success: false, message: 'You can only rate the trip poster' });
    }

    // Check if already rated
    const alreadyRated = ride.ratings.some(
      (r) => r.fromUser.toString() === req.user._id.toString() && r.toUser.toString() === toUserId
    );
    if (alreadyRated) {
      return res.status(400).json({ success: false, message: 'You have already rated this user for this ride' });
    }

    ride.ratings.push({
      fromUser: req.user._id,
      toUser: toUserId,
      score,
      comment: comment || '',
    });
    await ride.save();

    // Update target user's average rating
    const targetUser = await User.findById(toUserId);
    const newTotalRatings = targetUser.totalRatings + 1;
    const newRating = (targetUser.rating * targetUser.totalRatings + score) / newTotalRatings;
    targetUser.rating = Math.round(newRating * 10) / 10;
    targetUser.totalRatings = newTotalRatings;
    await targetUser.save();

    res.json({ success: true, message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Rate ride error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  acceptRide,
  rejectRide,
  getRide,
  getMyRides,
  startRide,
  completeRide,
  rateRide,
};
