/**
 * Cost Splitting Service
 * Calculates and splits fares between ride participants
 */

// Base fare rates (in INR)
const FARE_RATES = {
  car: { baseFare: 30, perKm: 10, perMin: 1.5 },
  bike: { baseFare: 15, perKm: 6, perMin: 1 },
  auto: { baseFare: 25, perKm: 8, perMin: 1.2 },
  bus: { baseFare: 10, perKm: 3, perMin: 0.5 },
  any: { baseFare: 25, perKm: 8, perMin: 1.2 },
};

/**
 * Calculate estimated fare based on distance and duration
 * @param {number} distanceMeters - Distance in meters
 * @param {number} durationSeconds - Duration in seconds
 * @param {string} vehicleType - Type of vehicle
 * @returns {number} Estimated fare in INR
 */
const calculateFare = (distanceMeters, durationSeconds, vehicleType = 'any') => {
  const rates = FARE_RATES[vehicleType] || FARE_RATES.any;
  const distanceKm = distanceMeters / 1000;
  const durationMin = durationSeconds / 60;

  const fare = rates.baseFare + rates.perKm * distanceKm + rates.perMin * durationMin;

  return Math.round(fare);
};

/**
 * Split fare equally among riders
 * @param {number} totalFare - Total fare amount
 * @param {number} numberOfRiders - Number of riders sharing the fare
 * @returns {object} Fare split details
 */
const splitFare = (totalFare, numberOfRiders) => {
  if (numberOfRiders <= 0) {
    throw new Error('Number of riders must be greater than 0');
  }

  const farePerPerson = totalFare > 0 ? Math.ceil(totalFare / numberOfRiders) : 0;
  // Savings = what you'd pay alone minus your share
  const savingsPerPerson = totalFare > 0 ? totalFare - farePerPerson : 0;
  const savingsPercentage = totalFare > 0 ? Math.round((savingsPerPerson / totalFare) * 100) : 0;

  return {
    totalFare,
    numberOfRiders,
    farePerPerson,
    totalCollected: farePerPerson * numberOfRiders,
    savingsPerPerson,
    savingsPercentage,
  };
};

/**
 * Calculate fare split for a ride with multiple users
 * @param {Array} users - Array of user objects with their trip details
 * @param {string} vehicleType - Vehicle type
 * @returns {object} Detailed fare split
 */
const calculateRideFareSplit = (users, vehicleType = 'any') => {
  if (!users || users.length === 0) {
    throw new Error('At least one user is required');
  }

  // Use the maximum distance/duration among all users for total fare
  let maxDistance = 0;
  let maxDuration = 0;

  users.forEach((user) => {
    if (user.distance > maxDistance) maxDistance = user.distance;
    if (user.duration > maxDuration) maxDuration = user.duration;
  });

  const totalFare = calculateFare(maxDistance, maxDuration, vehicleType);
  const split = splitFare(totalFare, users.length);

  return {
    ...split,
    vehicleType,
    distance: maxDistance,
    duration: maxDuration,
    breakdown: users.map((user) => ({
      userId: user.userId,
      name: user.name,
      amount: split.farePerPerson,
      pickup: user.pickup,
    })),
  };
};

module.exports = {
  calculateFare,
  splitFare,
  calculateRideFareSplit,
  FARE_RATES,
};
