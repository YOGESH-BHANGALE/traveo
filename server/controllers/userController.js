const User = require('../models/User');
const { body, validationResult } = require('express-validator');

/**
 * Get user profile
 * GET /api/users/profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Update user profile
 * PUT /api/users/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phone, profilePhoto, emergencyContact, city } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profilePhoto) updateData.profilePhoto = profilePhoto;
    if (emergencyContact) updateData.emergencyContact = emergencyContact;
    if (city !== undefined) updateData.city = city;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Get public user profile
 * GET /api/users/:userId
 */
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      'name profilePhoto rating totalRatings totalTrips createdAt'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Report a user
 * POST /api/users/:userId/report
 */
const reportUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot report yourself',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already reported by this user
    const alreadyReported = user.reportedBy.some(
      (r) => r.userId.toString() === req.user._id.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this user',
      });
    }

    user.reportedBy.push({
      userId: req.user._id,
      reason: reason || 'No reason provided',
    });

    await user.save();

    res.json({
      success: true,
      message: 'User reported successfully',
    });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Subscribe to push notifications
 * POST /api/users/subscribe
 */
const subscribePush = async (req, res) => {
  try {
    const { subscription } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription: subscription,
    });

    res.json({
      success: true,
      message: 'Push subscription saved',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getPublicProfile,
  reportUser,
  subscribePush,
};
