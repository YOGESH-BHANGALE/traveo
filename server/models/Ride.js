const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const rideSchema = new mongoose.Schema(
  {
    rideCode: {
      type: String,
      unique: true,
      default: () => `RIDE-${uuidv4().slice(0, 8).toUpperCase()}`,
    },
    trips: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
      },
    ],
    users: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['creator', 'joiner'], default: 'joiner' },
        fare: { type: Number, default: 0 },
        paid: { type: Boolean, default: false },
      },
    ],
    totalFare: {
      type: Number,
      default: 0,
    },
    farePerPerson: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'confirmed',
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    ratings: [
      {
        fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        score: { type: Number, min: 1, max: 5 },
        comment: { type: String, maxlength: 500 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

rideSchema.index({ 'users.user': 1, status: 1 });

module.exports = mongoose.model('Ride', rideSchema);
