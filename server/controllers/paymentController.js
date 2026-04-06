const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/**
 * Create Razorpay order
 * POST /api/payment/create-order
 * body: { amount (INR), bookingId?, rideId?, description }
 */
const createOrder = async (req, res) => {
  try {
    const { amount, bookingId, rideId, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Valid amount required' });

    const razorpay = getRazorpay();
    const amountPaise = Math.round(parseFloat(amount) * 100); // convert to paise

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { userId: req.user._id.toString(), bookingId: bookingId || '', rideId: rideId || '' },
    });

    const payment = await Payment.create({
      user: req.user._id,
      booking: bookingId || null,
      ride: rideId || null,
      razorpayOrderId: order.id,
      amount: amountPaise,
      description: description || '',
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: amountPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment order creation failed' });
  }
};

/**
 * Verify Razorpay payment signature and mark as paid
 * POST /api/payment/verify
 * body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId?, rideId? }
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId, rideId } = req.body;

    // Verify signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { razorpayPaymentId, razorpaySignature, status: 'paid' },
      { new: true }
    );

    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    // Mark booking as paid if applicable
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'paid', paymentId: razorpayPaymentId, orderId: razorpayOrderId });
    }

    // Mark ride user as paid if applicable
    if (rideId) {
      await Ride.updateOne(
        { _id: rideId, 'users.user': req.user._id },
        { $set: { 'users.$.paid': true } }
      );
    }

    res.json({ success: true, message: 'Payment verified', payment });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

/**
 * Get user's payment history
 * GET /api/payment/history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('booking')
      .populate('ride', 'rideCode status')
      .sort({ createdAt: -1 });

    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createOrder, verifyPayment, getPaymentHistory };
