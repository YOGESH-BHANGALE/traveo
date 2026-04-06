const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    auto: { type: mongoose.Schema.Types.ObjectId, ref: 'Auto', required: true },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seatNumber: { type: Number, required: true },
    pickupLocation: {
      address: { type: String, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    dropLocation: {
      address: { type: String, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    fare: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'boarded', 'completed', 'cancelled'],
      default: 'confirmed',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    paymentId: { type: String, default: null },   // Razorpay payment ID
    orderId: { type: String, default: null },      // Razorpay order ID
    rideType: {
      type: String,
      enum: ['planned', 'live'],
      default: 'live',
    },
  },
  { timestamps: true }
);

bookingSchema.index({ auto: 1, seatNumber: 1 }, { unique: true });
bookingSchema.index({ rider: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
