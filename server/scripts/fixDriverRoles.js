/**
 * Migration script to fix driver roles
 * Run this once to update existing users who have driver verification but role='user'
 * 
 * Usage: node scripts/fixDriverRoles.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const fixDriverRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users who have driver verification but role is still 'user'
    const result = await User.updateMany(
      {
        role: 'user',
        $or: [
          { 'driverVerification.verifiedBadge': true },
          { 'driverVerification.aadharNumber': { $exists: true, $ne: '' } },
          { 'driverVerification.licenseNumber': { $exists: true, $ne: '' } },
        ],
      },
      {
        $set: { role: 'driver' },
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users to driver role`);

    // List the updated users
    const drivers = await User.find({ role: 'driver' }).select('name email role');
    console.log('\n📋 Current drivers:');
    drivers.forEach((d) => console.log(`  - ${d.name} (${d.email})`));

    await mongoose.connection.close();
    console.log('\n✅ Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

fixDriverRoles();
