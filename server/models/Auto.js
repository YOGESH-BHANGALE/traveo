const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const autoSchema = new mongoose.Schema(
  {
    autoCode: {
      type: String,
      unique: true,
      default: () => `AUTO-${uuidv4().slice(0, 6).toUpperCase()}`,
    },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    route: {
      source: {
        address: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      destination: {
        address: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    totalSeats: { type: Number, required: true, min: 1, max: 6, default: 3 },
    availableSeats: { type: Number, min: 0, max: 6 },
    farePerSeat: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['online', 'boarding', 'in_progress', 'completed', 'offline'],
      default: 'online',
    },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    boardingDeadline: { type: Date, default: null }, // countdown timer
    departureTime: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
    vehicleNumber: { type: String, trim: true, default: '' },
    vehicleModel: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

autoSchema.pre('save', function (next) {
  if (this.isNew) this.availableSeats = this.totalSeats;
  next();
});

autoSchema.index({ 'route.source.lat': 1, 'route.source.lng': 1 });
autoSchema.index({ status: 1 });
autoSchema.index({ driver: 1 });

module.exports = mongoose.model('Auto', autoSchema);
