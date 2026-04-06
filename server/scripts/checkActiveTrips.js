const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Trip = require('../models/Trip');

const checkAndFixActiveTrips = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find trips with 'active' status (old status)
    const activeTrips = await Trip.find({ status: 'active' })
      .populate('user', 'name role');

    console.log(`📊 Found ${activeTrips.length} trips with 'active' status\n`);

    if (activeTrips.length === 0) {
      console.log('✅ No trips need migration. All trips have new status values.');
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    console.log('🔄 Migrating trips from "active" to new status...\n');

    for (const trip of activeTrips) {
      const oldStatus = trip.status;
      
      // Determine new status based on seat availability
      if (trip.bookedSeats === 0) {
        trip.status = 'open';
      } else if (trip.bookedSeats < trip.seats) {
        trip.status = 'partially_filled';
      } else {
        trip.status = 'full';
      }

      await trip.save();
      
      console.log(`✅ Trip ${trip._id}`);
      console.log(`   Posted by: ${trip.user.name} (${trip.user.role})`);
      console.log(`   Status: ${oldStatus} → ${trip.status}`);
      console.log(`   Seats: ${trip.bookedSeats}/${trip.seats}\n`);
    }

    console.log(`\n✅ Successfully migrated ${activeTrips.length} trips`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkAndFixActiveTrips();
