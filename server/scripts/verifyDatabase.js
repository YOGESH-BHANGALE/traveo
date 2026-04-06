/**
 * Script to verify database schema and data integrity
 * Usage: node scripts/verifyDatabase.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Ride = require('../models/Ride');
const Match = require('../models/Match');

const verifyDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check Users
    console.log('📊 USER STATISTICS:');
    const totalUsers = await User.countDocuments();
    const riders = await User.countDocuments({ role: 'user' });
    const drivers = await User.countDocuments({ role: 'driver' });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const googleUsers = await User.countDocuments({ googleId: { $exists: true, $ne: null } });
    
    console.log(`  Total Users: ${totalUsers}`);
    console.log(`  Riders: ${riders}`);
    console.log(`  Drivers: ${drivers}`);
    console.log(`  Verified: ${verifiedUsers}`);
    console.log(`  Google OAuth: ${googleUsers}`);

    // Check for users without role (should be none)
    const usersWithoutRole = await User.find({ 
      $or: [
        { role: { $exists: false } },
        { role: null },
        { role: '' }
      ]
    }).select('name email');
    
    if (usersWithoutRole.length > 0) {
      console.log('\n⚠️  Users without role:');
      usersWithoutRole.forEach(u => console.log(`    - ${u.name} (${u.email})`));
      console.log('  Run fixDriverRoles.js to fix this.');
    } else {
      console.log('  ✅ All users have valid roles');
    }

    // Check Trips
    console.log('\n📊 TRIP STATISTICS:');
    const totalTrips = await Trip.countDocuments();
    const activeTrips = await Trip.countDocuments({ status: 'active' });
    const tripsByRiders = await Trip.countDocuments({ user: { $in: await User.find({ role: 'user' }).distinct('_id') } });
    const tripsByDrivers = await Trip.countDocuments({ user: { $in: await User.find({ role: 'driver' }).distinct('_id') } });
    
    console.log(`  Total Trips: ${totalTrips}`);
    console.log(`  Active Trips: ${activeTrips}`);
    console.log(`  Posted by Riders: ${tripsByRiders}`);
    console.log(`  Posted by Drivers: ${tripsByDrivers}`);

    // Check Rides
    console.log('\n📊 RIDE STATISTICS:');
    const totalRides = await Ride.countDocuments();
    const confirmedRides = await Ride.countDocuments({ status: 'confirmed' });
    const inProgressRides = await Ride.countDocuments({ status: 'in_progress' });
    const completedRides = await Ride.countDocuments({ status: 'completed' });
    
    console.log(`  Total Rides: ${totalRides}`);
    console.log(`  Confirmed: ${confirmedRides}`);
    console.log(`  In Progress: ${inProgressRides}`);
    console.log(`  Completed: ${completedRides}`);

    // Check Matches
    console.log('\n📊 MATCH STATISTICS:');
    const totalMatches = await Match.countDocuments();
    const pendingMatches = await Match.countDocuments({ status: 'pending' });
    const acceptedMatches = await Match.countDocuments({ status: 'accepted' });
    
    console.log(`  Total Matches: ${totalMatches}`);
    console.log(`  Pending: ${pendingMatches}`);
    console.log(`  Accepted: ${acceptedMatches}`);

    // List all users with details
    console.log('\n📋 USER DETAILS:');
    const users = await User.find({}).select('name email role isVerified phone vehicleNumber vehicleModel driverVerification').sort({ createdAt: -1 });
    
    users.forEach((u, i) => {
      console.log(`\n${i + 1}. ${u.name}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Verified: ${u.isVerified}`);
      console.log(`   Phone: ${u.phone || 'Not set'}`);
      if (u.role === 'driver') {
        console.log(`   Vehicle: ${u.vehicleModel || 'Not set'} (${u.vehicleNumber || 'No number'})`);
        console.log(`   Driver Badge: ${u.driverVerification?.verifiedBadge || false}`);
      }
    });

    console.log('\n✅ Database verification complete');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

verifyDatabase();
