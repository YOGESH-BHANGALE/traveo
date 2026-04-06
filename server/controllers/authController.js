const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Register a new user
 * POST /api/auth/register
 */
  const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, phone, role, vehicleNumber, vehicleModel } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Check if trying to register with a different role
      const requestedRole = role === 'driver' ? 'driver' : 'user';
      if (existingUser.role !== requestedRole) {
        return res.status(400).json({ 
          success: false, 
          message: `This email is already registered as a ${existingUser.role === 'driver' ? 'Driver' : 'Rider'}. Please use a different email or login with your existing account.` 
        });
      }
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const userData = {
      name, email, password, phone,
      role: role === 'driver' ? 'driver' : 'user',
    };
    if (role === 'driver') {
      if (vehicleNumber) userData.vehicleNumber = vehicleNumber;
      if (vehicleModel) userData.vehicleModel = vehicleModel;
    }

    const user = await User.create(userData);
    const token = generateToken(user._id);

    res.status(201).json({ success: true, token, user: user.toPublicJSON() });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password, role } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is trying to login with a different role
    if (role) {
      const requestedRole = role === 'driver' ? 'driver' : 'user';
      if (user.role !== requestedRole) {
        return res.status(403).json({
          success: false,
          message: `This email is registered as a ${user.role === 'driver' ? 'Driver' : 'Rider'}. Please login from the correct page or use a different email.`,
          registeredRole: user.role
        });
      }
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

/**
 * Google OAuth callback handler
 */
const googleCallback = (req, res) => {
  try {
    const token = generateToken(req.user._id);
    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/auth/login?error=oauth_failed`);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
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

module.exports = {
  register,
  login,
  googleCallback,
  getMe,
  registerValidation,
  loginValidation,
};
