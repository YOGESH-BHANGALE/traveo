const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const User = require('../models/User');

const testConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get a driver and a rider
    const driver = await User.findOne({ role: 'driver' });
    const rider = await User.findOne({ role: 'user' });

    console.log(`👤 Driver: ${driver.name} (${driver.email})`);
    console.log(`👤 Rider: ${rider.name} (${rider.email})\n`);

    // Find an open trip posted by the driver
    const trip = await Trip.findOne({ 
      user: driver._id,
      status: { $in: ['open', 'partially_filled'] },
      closedManually: false
    }).populate('user', 'name role');

    if (!trip) {
      console.log('❌ No open trips found posted by driver');
      console.log('💡 Create a trip as driver first, then run this test again');
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    console.log('📍 Found trip:');
    console.log(`   ID: ${trip._id}`);
    console.log(`   Posted by: ${trip.user.name} (${trip.user.role})`);
    console.log(`   Status: ${trip.status}`);
    console.log(`   Seats: ${trip.bookedSeats}/${trip.seats} (${trip.availableSeats} available)`);
    console.log(`   Closed manually: ${trip.closedManually}`);
    console.log(`   Source: ${trip.source.landmark || trip.source.address.substring(0, 50)}`);
    console.log(`   Destination: ${trip.destination.landmark || trip.destination.address.substring(0, 50)}\n`);

    // Check if trip can be connected to
    const validStatuses = ['open', 'partially_filled'];
    const canConnect = validStatuses.includes(trip.status) && 
                       !trip.closedManually && 
                       trip.availableSeats > 0 &&
                       trip.user._id.toString() !== rider._id.toString();

    console.log('🔍 Connection Check:');
    console.log(`   ✅ Status is valid: ${validStatuses.includes(trip.status)}`);
    console.log(`   ✅ Not closed manually: ${!trip.closedManually}`);
    console.log(`   ✅ Has available seats: ${trip.availableSeats > 0}`);
    console.log(`   ✅ Not own trip: ${trip.user._id.toString() !== rider._id.toString()}`);
    console.log(`\n   ${canConnect ? '✅ RIDER CAN CONNECT TO THIS TRIP' : '❌ RIDER CANNOT CONNECT'}`);

    if (!canConnect) {
      console.log('\n⚠️  Trip cannot be connected to. Reasons:');
      if (!validStatuses.includes(trip.status)) {
        console.log(`   - Status is '${trip.status}' (must be 'open' or 'partially_filled')`);
      }
      if (trip.closedManually) {
        console.log('   - Trip is closed manually');
      }
      if (trip.availableSeats <= 0) {
        console.log('   - No available seats');
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testConnect();
