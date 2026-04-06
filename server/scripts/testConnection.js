/**
 * Test Database Connection Speed
 * Measures query performance after adding indexes
 * 
 * Usage: node server/scripts/testConnection.js
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Match = require('../models/Match');
const Ride = require('../models/Ride');

async function testConnection() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const startConnect = Date.now();
    await mongoose.connect(process.env.MONGODB_URI);
    const connectTime = Date.now() - startConnect;
    console.log(`✅ Connected in ${connectTime}ms\n`);

    console.log('⚡ Testing query performance...\n');

    // Test 1: Find user by email
    const start1 = Date.now();
    await User.findOne({ email: 'test@example.com' });
    const time1 = Date.now() - start1;
    console.log(`1. User.findOne (by email): ${time1}ms`);

    // Test 2: Find trips by user
    const start2 = Date.now();
    const users = await User.find().limit(1);
    if (users.length > 0) {
      await Trip.find({ user: users[0]._id });
    }
    const time2 = Date.now() - start2;
    console.log(`2. Trip.find (by user): ${time2}ms`);

    // Test 3: Find trips by status
    const start3 = Date.now();
    await Trip.find({ status: 'open' }).limit(10);
    const time3 = Date.now() - start3;
    console.log(`3. Trip.find (by status): ${time3}ms`);

    // Test 4: Find matches by trip
    const start4 = Date.now();
    const trips = await Trip.find().limit(1);
    if (trips.length > 0) {
      await Match.find({ trip: trips[0]._id });
    }
    const time4 = Date.now() - start4;
    console.log(`4. Match.find (by trip): ${time4}ms`);

    // Test 5: Find rides by user
    const start5 = Date.now();
    if (users.length > 0) {
      await Ride.find({ 'users.user': users[0]._id });
    }
    const time5 = Date.now() - start5;
    console.log(`5. Ride.find (by user): ${time5}ms`);

    const avgTime = (time1 + time2 + time3 + time4 + time5) / 5;
    console.log(`\n📊 Average query time: ${avgTime.toFixed(2)}ms`);

    if (avgTime < 100) {
      console.log('✅ Excellent performance! Queries are fast.');
    } else if (avgTime < 500) {
      console.log('⚠️  Moderate performance. Consider optimizing queries.');
    } else {
      console.log('❌ Slow performance. Check network connection and indexes.');
    }

    // Count documents
    console.log('\n📈 Database statistics:');
    const userCount = await User.countDocuments();
    const tripCount = await Trip.countDocuments();
    const matchCount = await Match.countDocuments();
    const rideCount = await Ride.countDocuments();
    
    console.log(`  Users: ${userCount}`);
    console.log(`  Trips: ${tripCount}`);
    console.log(`  Matches: ${matchCount}`);
    console.log(`  Rides: ${rideCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

testConnection();
