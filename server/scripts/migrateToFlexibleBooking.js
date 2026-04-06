/**
 * Migration script to update existing trips to flexible booking system
 * Usage: node scripts/migrateToFlexibleBooking.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Trip = require('../models/Trip');

const migrateTrips = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔄 Migrating trips to flexible booking system...\n');

    const trips = await Trip.find({});
    console.log(`Found ${trips.length} trips to migrate\n`);

    let migrated = 0;
    let skipped = 0;

    for (const trip of trips) {
      let updated = false;

      // Add bookedSeats if missing
      if (trip.bookedSeats === undefined) {
        trip.bookedSeats = 0;
        updated = true;
      }

      // Add bookings array if missing
      if (!trip.bookings || trip.bookings.length === 0) {
        trip.bookings = [];
        updated = true;
      }

      // Add driverDecision if missing
      if (!trip.driverDecision) {
        trip.driverDecision = {
          canStartPartial: true,
          autoStartWhenFull: false,
        };
        updated = true;
      }

      // Add closedManually if missing
      if (trip.closedManually === undefined) {
        trip.closedManually = false;
        updated = true;
      }

      // Update status from old enum to new enum
      if (trip.status === 'active') {
        if (trip.bookedSeats === 0) {
          trip.status = 'open';
        } else if (trip.bookedSeats < trip.seats) {
          trip.status = 'partially_filled';
        } else {
          trip.status = 'full';
        }
        updated = true;
      } else if (trip.status === 'matched') {
        // Matched trips should be marked as started or completed
        trip.status = 'started';
        updated = true;
      }

      if (updated) {
        await trip.save();
        migrated++;
        console.log(`✅ Migrated trip ${trip._id} (${trip.source.address} → ${trip.destination.address})`);
        console.log(`   Status: ${trip.status}, Seats: ${trip.seats}, Booked: ${trip.bookedSeats}`);
      } else {
        skipped++;
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETE');
    console.log('═══════════════════════════════════════');
    console.log(`Total trips: ${trips.length}`);
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped (already migrated): ${skipped}`);

    // Show summary of trip statuses
    console.log('\n📊 Trip Status Summary:');
    const statusCounts = await Trip.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    statusCounts.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateTrips();
