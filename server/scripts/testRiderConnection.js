/**
 * Test Rider-to-Rider Connection Flow
 * Verifies that riders can see and accept connection requests
 * 
 * Usage: node server/scripts/testRiderConnection.js
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Match = require('../models/Match');

async function testRiderConnection() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    console.log('🔍 Testing Rider-to-Rider Connection Flow...\n');

    // Find riders
    const riders = await User.find({ role: 'user' }).limit(2);
    
    if (riders.length < 2) {
      console.log('❌ Need at least 2 riders in database');
      console.log('   Current riders:', riders.length);
      process.exit(1);
    }

    const riderA = riders[0];
    const riderB = riders[1];

    console.log('👤 Rider A:', riderA.name, `(${riderA.email})`);
    console.log('👤 Rider B:', riderB.name, `(${riderB.email})\n`);

    // Find a trip posted by Rider A
    let tripByRiderA = await Trip.findOne({ user: riderA._id, status: { $in: ['open', 'partially_filled'] } });
    
    if (!tripByRiderA) {
      console.log('⚠️  No open trip found for Rider A');
      console.log('   Creating test trip...');
      
      tripByRiderA = await Trip.create({
        user: riderA._id,
        source: {
          address: 'Test Source',
          landmark: 'Test Landmark',
          area: 'Test Area',
          lat: 18.5,
          lng: 73.8,
          coordinates: [73.8, 18.5]
        },
        destination: {
          address: 'Test Destination',
          landmark: 'Test Dest',
          area: 'Test Area',
          lat: 18.6,
          lng: 73.9,
          coordinates: [73.9, 18.6]
        },
        date: new Date(Date.now() + 86400000), // Tomorrow
        time: '10:00',
        seats: 3,
        availableSeats: 3,
        bookedSeats: 0,
        status: 'open',
        vehicleType: 'car',
        estimatedFare: 200,
        bookings: []
      });
      
      console.log('   ✅ Test trip created\n');
    }

    console.log('🚗 Trip by Rider A:');
    console.log('   ID:', tripByRiderA._id);
    console.log('   Status:', tripByRiderA.status);
    console.log('   Seats:', `${tripByRiderA.bookedSeats}/${tripByRiderA.seats}\n`);

    // Check if Match already exists
    let match = await Match.findOne({
      trip: tripByRiderA._id,
      matchedUser: riderB._id
    });

    if (!match) {
      console.log('📝 Creating connection request from Rider B to Rider A...');
      
      match = await Match.create({
        trip: tripByRiderA._id,
        matchedTrip: null, // Rider B has no trip
        matchedUser: riderB._id,
        requestedBy: riderB._id,
        matchScore: 50,
        status: 'pending'
      });
      
      console.log('   ✅ Match created\n');
    } else {
      console.log('📝 Match already exists');
      console.log('   Status:', match.status, '\n');
    }

    // Test: Can Rider A fetch matches?
    console.log('🔍 Testing getTripMatches for Rider A...');
    
    const matchesForRiderA = await Match.find({ trip: tripByRiderA._id })
      .populate('matchedUser', 'name email role')
      .populate('trip', 'status seats');
    
    console.log('   Found', matchesForRiderA.length, 'match(es)');
    
    if (matchesForRiderA.length === 0) {
      console.log('   ❌ No matches found! This is the bug.');
    } else {
      console.log('   ✅ Matches found:');
      matchesForRiderA.forEach((m, i) => {
        console.log(`      ${i + 1}. ${m.matchedUser?.name} (${m.status})`);
      });
    }
    
    console.log();

    // Test: Check ownership
    console.log('🔍 Testing ownership check...');
    const tripWithUser = await Trip.findById(tripByRiderA._id).populate('user', 'name email role');
    
    console.log('   Trip user ID:', tripWithUser.user._id.toString());
    console.log('   Rider A ID:', riderA._id.toString());
    console.log('   Match:', tripWithUser.user._id.toString() === riderA._id.toString() ? '✅ Equal' : '❌ Not equal');
    console.log();

    // Test: Pending matches count
    const pendingMatches = matchesForRiderA.filter(m => m.status === 'pending');
    console.log('📊 Summary:');
    console.log('   Total matches:', matchesForRiderA.length);
    console.log('   Pending matches:', pendingMatches.length);
    console.log('   Trip owner:', tripWithUser.user.name);
    console.log('   Trip owner role:', tripWithUser.user.role);
    
    if (pendingMatches.length > 0) {
      console.log('\n✅ SUCCESS: Rider A should see Accept/Reject buttons');
      console.log('   Connection Requests section should show:', pendingMatches.length, 'request(s)');
    } else {
      console.log('\n❌ ISSUE: No pending matches found');
    }

    // Check if there are any errors in Match documents
    console.log('\n🔍 Checking Match document integrity...');
    const allMatches = await Match.find({ trip: tripByRiderA._id });
    
    for (const m of allMatches) {
      const issues = [];
      if (!m.trip) issues.push('Missing trip reference');
      if (!m.matchedUser) issues.push('Missing matchedUser reference');
      if (!m.requestedBy) issues.push('Missing requestedBy reference');
      if (!m.status) issues.push('Missing status');
      
      if (issues.length > 0) {
        console.log('   ⚠️  Match', m._id, 'has issues:', issues.join(', '));
      } else {
        console.log('   ✅ Match', m._id, 'is valid');
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

testRiderConnection();
