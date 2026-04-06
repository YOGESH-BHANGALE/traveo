const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'],
      sparse: true,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      sparse: true,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    totalTrips: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: '' },
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    pushSubscription: {
      type: Object,
      default: null,
    },
    reportedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        date: { type: Date, default: Date.now },
      },
    ],
    // Driver fields
    role: { type: String, enum: ['user', 'driver'], default: 'user' },
    driverMode: { type: String, enum: ['car', 'auto'], default: 'car' },
    vehicleNumber: { type: String, trim: true, default: '' },
    vehicleModel: { type: String, trim: true, default: '' },
    // Driver verification (demo — no real ID check)
    driverVerification: {
      aadharNumber: { type: String, default: '' },
      licenseNumber: { type: String, default: '' },
      mobileVerified: { type: Boolean, default: false },
      submittedAt: { type: Date },
      verifiedBadge: { type: Boolean, default: false },
    },
    // Payment methods (stored as masked references)
    paymentMethods: [
      {
        type: { type: String, enum: ['upi', 'card', 'netbanking'], default: 'upi' },
        identifier: { type: String, default: '' }, // UPI ID or masked card
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Return user without sensitive fields
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.googleId;
  delete obj.pushSubscription;
  delete obj.reportedBy;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
