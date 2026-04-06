const Trip = require('../models/Trip');
const Match = require('../models/Match');

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate time difference in minutes between two time strings
 * @param {string} time1 - Time string (HH:mm)
 * @param {Date} date1 - Date object
 * @param {string} time2 - Time string (HH:mm)
 * @param {Date} date2 - Date object
 * @returns {number} Time difference in minutes
 */
const timeDiffMinutes = (time1, date1, time2, date2) => {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);

  const d1 = new Date(date1);
  d1.setHours(h1, m1, 0, 0);

  const d2 = new Date(date2);
  d2.setHours(h2, m2, 0, 0);

  return Math.abs(d1 - d2) / (1000 * 60);
};

/**
 * Calculate match score based on distance and time proximity
 * Higher score = better match (0-100)
 */
const calculateMatchScore = (destDistance, sourceDistance, timeDiff) => {
  // Distance score: 1km = 0 penalty, 0km = max score
  const maxDistance = 1000; // 1km in meters
  const destScore = Math.max(0, (1 - destDistance / maxDistance) * 40);
  const sourceScore = Math.max(0, (1 - sourceDistance / maxDistance) * 30);

  // Time score: 0 min diff = max score, 30 min diff = 0 score
  const maxTimeDiff = 30;
  const timeScore = Math.max(0, (1 - timeDiff / maxTimeDiff) * 30);

  return Math.round(destScore + sourceScore + timeScore);
};

/**
 * Find matching trips for a given trip
 * Matching conditions:
 * - Destination within 1km
 * - Time difference < 30 minutes
 * - Same date
 * - Has available seats
 * - Not created by the same user
 */
const findMatches = async (tripId) => {
  const trip = await Trip.findById(tripId).populate('user');

  if (!trip) {
    throw new Error('Trip not found');
  }

  // Find trips on the same date with active status
  const tripDate = new Date(trip.date);
  const startOfDay = new Date(tripDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(tripDate);
  endOfDay.setHours(23, 59, 59, 999);

  const potentialMatches = await Trip.find({
    _id: { $ne: trip._id },
    user: { $ne: trip.user._id },
    status: 'active',
    date: { $gte: startOfDay, $lte: endOfDay },
    availableSeats: { $gte: 1 },
  }).populate('user');

  const matches = [];

  for (const candidate of potentialMatches) {
    // Calculate destination distance
    const destDistance = haversineDistance(
      trip.destination.lat,
      trip.destination.lng,
      candidate.destination.lat,
      candidate.destination.lng
    );

    // Skip if destination is more than 1km apart
    if (destDistance > 1000) continue;

    // Calculate source distance
    const sourceDistance = haversineDistance(
      trip.source.lat,
      trip.source.lng,
      candidate.source.lat,
      candidate.source.lng
    );

    // Calculate time difference
    const timeDiff = timeDiffMinutes(
      trip.time,
      trip.date,
      candidate.time,
      candidate.date
    );

    // Skip if time difference is more than 30 minutes
    if (timeDiff > 30) continue;

    // Calculate match score
    const matchScore = calculateMatchScore(destDistance, sourceDistance, timeDiff);

    // Check if match already exists
    const existingMatch = await Match.findOne({
      $or: [
        { trip: trip._id, matchedTrip: candidate._id },
        { trip: candidate._id, matchedTrip: trip._id },
      ],
    });

    if (!existingMatch) {
      const match = await Match.create({
        trip: trip._id,
        matchedTrip: candidate._id,
        matchedUser: candidate.user._id,
        requestedBy: trip.user._id,
        matchScore,
        distanceDiff: Math.round(destDistance),
        timeDiff: Math.round(timeDiff),
      });

      matches.push({
        ...match.toObject(),
        matchedTrip: candidate,
        matchedUser: candidate.user,
      });
    }
  }

  // Sort by match score (highest first)
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches;
};

/**
 * Get existing matches for a trip
 * Returns matches where this trip is either the owner OR the requester
 */
const getMatchesForTrip = async (tripId) => {
  const matches = await Match.find({
    $or: [
      { trip: tripId },
      { matchedTrip: tripId },
    ],
  })
    .populate({
      path: 'trip',
      populate: { path: 'user', select: 'name email profilePhoto rating' },
    })
    .populate({
      path: 'matchedTrip',
      populate: { path: 'user', select: 'name email profilePhoto rating' },
    })
    .populate('matchedUser', 'name email profilePhoto rating phone')
    .populate('requestedBy', 'name email profilePhoto rating')
    .sort({ matchScore: -1 });

  return matches;
};

module.exports = {
  findMatches,
  getMatchesForTrip,
  haversineDistance,
  calculateMatchScore,
};
