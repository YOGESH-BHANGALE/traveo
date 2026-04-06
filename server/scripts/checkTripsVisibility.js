const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const User = require('../models/User');

const checkVisibility = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all trips
    const trips = await Trip.find({})
      .populate('user', 'name role email')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`📊 Found ${trips.length} recent trips:\n`);

    trips.forEach((trip, i) => {
      console.log(`${i + 1}. Trip ID: ${trip._id}`);
      console.log(`   Posted by: ${trip.user.name} (${trip.user.role})`);
      console.log(`   Status: ${trip.status}`);
      console.log(`   Seats: ${trip.bookedSeats}/${trip.seats} (${trip.availableSeats} available)`);
      console.log(`   Closed manually: ${trip.closedManually}`);
      console.log(`   Date: ${new Date(trip.date).toLocaleDateString()}`);
      console.log(`   Source: ${trip.source.landmark || trip.source.address.substring(0, 50)}`);
      console.log(`   Destination: ${trip.destination.landmark || trip.destination.address.substring(0, 50)}`);
      
      // Check if visible to riders
      const visibleToRiders = ['open', 'partially_filled'].includes(trip.status) && 
                              trip.availableSeats >= 1 && 
                              !trip.closedManually;
      console.log(`   ✅ Visible to riders: ${visibleToRiders ? 'YES' : 'NO'}`);
      
      if (!visibleToRiders) {
        console.log(`   ⚠️  Reason: ${
          !['open', 'partially_filled'].includes(trip.status) ? `Status is '${trip.status}'` :
          trip.availableSeats < 1 ? 'No available seats' :
          trip.closedManually ? 'Closed manually' : 'Unknown'
        }`);
      }
      console.log('');
    });

    // Check users
    console.log('\n👥 Users:');
    const users = await User.find({}).select('name role email');
    users.forEach(u => {
      console.log(`  - ${u.name} (${u.email}): ${u.role}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkVisibility();
