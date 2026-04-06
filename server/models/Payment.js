const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', default: null },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    amount: { type: Number, required: true }, // in paise (INR * 100)
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
