const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  register,
  login,
  googleCallback,
  getMe,
  registerValidation,
  loginValidation,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Register
router.post('/register', registerValidation, register);

// Login
router.post('/login', loginValidation, login);

// Get current user
router.get('/me', protect, getMe);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/auth/login?error=oauth_failed`,
    session: false,
  }),
  googleCallback
);

module.exports = router;
