/**
 * Script to manually set a user as a driver by email
 * 
 * Usage: node scripts/makeUserDriver.js <email>
 * Example: node scripts/makeUserDriver.js nandu@example.com
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const makeUserDriver = async () => {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.log('❌ Please provide an email address');
      console.log('Usage: node scripts/makeUserDriver.js <email>');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find and update the user
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { 
        $set: { 
          role: 'driver',
          isVerified: true,
          'driverVerification.verifiedBadge': true,
        } 
      },
      { new: true }
    );

    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      
      // List all users to help find the right one
      const allUsers = await User.find({}).select('name email role');
      console.log('\n📋 Available users:');
      allUsers.forEach((u) => console.log(`  - ${u.name} (${u.email}) - Role: ${u.role}`));
    } else {
      console.log(`✅ Updated user: ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Verified: ${user.isVerified}`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

makeUserDriver();
