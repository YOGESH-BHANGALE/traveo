const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true, // Enable access to req object
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Get role from state parameter (passed from frontend)
        const role = req.query.state || 'user';
        
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          if (!user.profilePhoto && profile.photos[0]) {
            user.profilePhoto = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        // Create new user with role from OAuth state
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          profilePhoto: profile.photos[0]?.value || '',
          isVerified: true,
          role: role === 'driver' ? 'driver' : 'user', // Set role from state parameter
        });

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

module.exports = passport;
