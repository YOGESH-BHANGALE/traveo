const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    source: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      placeId: { type: String },
      landmark: { type: String, default: '' },
      area: { type: String, default: '' },
      region: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    destination: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      placeId: { type: String },
      landmark: { type: String, default: '' },
      area: { type: String, default: '' },
      region: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    date: {
      type: Date,
      required: [true, 'Trip date is required'],
    },
    time: {
      type: String,
      required: [true, 'Trip time is required'],
    },
    seats: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
      default: 1,
    },
    availableSeats: {
      type: Number,
      min: 0,
      max: 6,
    },
    vehicleType: {
      type: String,
      enum: ['car', 'bike', 'auto', 'any'],
      default: 'any',
    },
    status: {
      type: String,
      enum: ['open', 'partially_filled', 'full', 'started', 'in_progress', 'completed', 'cancelled', 'closed'],
      default: 'open',
    },
    bookedSeats: {
      type: Number,
      default: 0,
      min: 0,
    },
    bookings: [
      {
        rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        seatsBooked: { type: Number, default: 1, min: 1 },
        status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'confirmed' },
        bookedAt: { type: Date, default: Date.now },
      },
    ],
    driverDecision: {
      canStartPartial: { type: Boolean, default: true }, // Can driver start with partial seats?
      autoStartWhenFull: { type: Boolean, default: false }, // Auto-start when all seats filled?
      decisionDeadline: { type: Date }, // Optional deadline for driver to decide
    },
    closedManually: {
      type: Boolean,
      default: false,
    },
    closedAt: {
      type: Date,
    },
    estimatedDistance: {
      type: Number, // in meters
      default: 0,
    },
    estimatedDuration: {
      type: Number, // in seconds
      default: 0,
    },
    estimatedFare: {
      type: Number, // in currency units
      default: 0,
    },
    notes: {
      type: String,
      maxlength: 500,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Set availableSeats to seats on creation
tripSchema.pre('save', function (next) {
  if (this.isNew) {
    this.availableSeats = this.seats;
    this.bookedSeats = 0;
  }
  
  // Update status based on seat availability
  if (!this.closedManually && this.status !== 'started' && this.status !== 'in_progress' && this.status !== 'completed' && this.status !== 'cancelled') {
    if (this.bookedSeats === 0) {
      this.status = 'open';
    } else if (this.bookedSeats < this.seats) {
      this.status = 'partially_filled';
    } else if (this.bookedSeats >= this.seats) {
      this.status = 'full';
      // Auto-start if enabled
      if (this.driverDecision?.autoStartWhenFull && this.status !== 'started') {
        this.status = 'started';
      }
    }
  }
  
  next();
});

// Index for geospatial queries
tripSchema.index({ 'source.lat': 1, 'source.lng': 1 });
tripSchema.index({ 'destination.lat': 1, 'destination.lng': 1 });
tripSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Trip', tripSchema);
