/**
 * Fix seat count mismatches in existing trips
 * Usage: node scripts/fixSeatCounts.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Trip = require('../models/Trip');

const fixSeatCounts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const trips = await Trip.find({});
    console.log(`Found ${trips.length} trips\n`);

    let fixed = 0;

    for (const trip of trips) {
      const expectedAvailable = trip.seats - trip.bookedSeats;
      
      if (trip.availableSeats !== expectedAvailable) {
        console.log(`Fixing trip ${trip._id}:`);
        console.log(`  Seats: ${trip.seats}, Booked: ${trip.bookedSeats}`);
        console.log(`  Old availableSeats: ${trip.availableSeats}`);
        console.log(`  New availableSeats: ${expectedAvailable}`);
        
        trip.availableSeats = expectedAvailable;
        await trip.save();
        fixed++;
        console.log(`  ✅ Fixed\n`);
      }
    }

    console.log('═══════════════════════════════════════');
    console.log(`✅ Fixed ${fixed} trips`);
    console.log(`✅ ${trips.length - fixed} trips were already correct`);
    console.log('═══════════════════════════════════════');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixSeatCounts();
