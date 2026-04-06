const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    matchedTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
    },
    matchedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    matchScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    distanceDiff: {
      type: Number, // in meters
      default: 0,
    },
    timeDiff: {
      type: Number, // in minutes
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'accepted', 'rejected', 'expired', 'cancelled'],
      default: 'pending',
    },
    seatsRequested: {
      type: Number,
      default: 1,
      min: 1,
      max: 6,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Unique per trip + requester — allows multiple passengers per trip
matchSchema.index({ trip: 1, matchedUser: 1 }, { unique: true });
matchSchema.index({ matchedUser: 1, status: 1 });
// Auto-expire pending matches after 48 hours
matchSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 172800, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('Match', matchSchema);
