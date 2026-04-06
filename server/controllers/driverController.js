const User = require('../models/User');
const Trip = require('../models/Trip');
const Ride = require('../models/Ride');
const Auto = require('../models/Auto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

/**
 * Get driver dashboard summary
 * GET /api/driver/dashboard
 */
const getDriverDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Planned rides (as creator)
    const myTrips = await Trip.find({ user: userId }).sort({ createdAt: -1 }).limit(10);
    const myRides = await Ride.find({ 'users.user': userId, 'users.role': 'creator' })
      .populate('users.user', 'name profilePhoto rating')
      .sort({ createdAt: -1 })
      .limit(10);

    // Auto sessions
    const myAutos = await Auto.find({ driver: userId })
      .populate({ path: 'bookings', populate: { path: 'rider', select: 'name profilePhoto rating' } })
      .sort({ createdAt: -1 })
      .limit(10);

    // Active auto session
    const activeAuto = await Auto.findOne({
      driver: userId,
      status: { $in: ['online', 'boarding', 'in_progress'] },
    }).populate({ path: 'bookings', populate: { path: 'rider', select: 'name profilePhoto rating phone' } });

    // Earnings from paid bookings
    const paidBookings = await Booking.find({
      paymentStatus: 'paid',
    }).populate({ path: 'auto', match: { driver: userId } });

    const autoEarnings = paidBookings
      .filter((b) => b.auto)
      .reduce((sum, b) => sum + (b.fare || 0), 0);

    // Earnings from planned rides (fare collected)
    const completedRides = await Ride.find({
      'users.user': userId,
      'users.role': 'creator',
      status: 'completed',
    });
    const plannedEarnings = completedRides.reduce((sum, r) => sum + (r.farePerPerson || 0), 0);

    const totalEarnings = autoEarnings + plannedEarnings;
    const totalTrips = (req.user.totalTrips || 0);

    res.json({
      success: true,
      dashboard: {
        totalEarnings,
        autoEarnings,
        plannedEarnings,
        totalTrips,
        activeAuto,
        recentTrips: myTrips,
        recentRides: myRides,
        recentAutos: myAutos,
        rating: req.user.rating,
      },
    });
  } catch (error) {
    console.error('Driver dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Toggle driver mode (car/auto)
 * PUT /api/driver/mode
 * body: { mode: 'car' | 'auto' }
 */
const setDriverMode = async (req, res) => {
  try {
    const { mode } = req.body;
    if (!['car', 'auto'].includes(mode))
      return res.status(400).json({ success: false, message: 'Mode must be car or auto' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { driverMode: mode },
      { new: true }
    );

    res.json({ success: true, driverMode: user.driverMode });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Submit driver verification (demo — auto-approves)
 * POST /api/driver/verify
 * body: { aadharNumber, licenseNumber, phone }
 */
const submitVerification = async (req, res) => {
  try {
    const { aadharNumber, licenseNumber, phone } = req.body;

    if (!aadharNumber || !licenseNumber || !phone) {
      return res.status(400).json({ success: false, message: 'Aadhar number, license number and phone are required' });
    }
    if (!/^\d{12}$/.test(aadharNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ success: false, message: 'Aadhar number must be 12 digits' });
    }
    if (phone.replace(/\D/g, '').length !== 10) {
      return res.status(400).json({ success: false, message: 'Phone number must be 10 digits' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        role: 'driver', // Set role to driver
        phone: phone.replace(/\D/g, ''),
        'driverVerification.aadharNumber': aadharNumber.replace(/\s/g, ''),
        'driverVerification.licenseNumber': licenseNumber.toUpperCase(),
        'driverVerification.mobileVerified': true,
        'driverVerification.submittedAt': new Date(),
        'driverVerification.verifiedBadge': true, // demo: auto-approve
        isVerified: true,
      },
      { new: true }
    );

    res.json({ success: true, message: 'Verification successful! You now have a Verified badge.', user: user.toPublicJSON() });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getDriverDashboard, setDriverMode, submitVerification };
