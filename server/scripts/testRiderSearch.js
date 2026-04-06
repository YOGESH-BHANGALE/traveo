const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const User = require('../models/User');

// Simulate rider search from Pune location
const testRiderSearch = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get rider user
    const rider = await User.findOne({ role: 'user' });
    console.log(`👤 Testing as rider: ${rider.name} (${rider.email})\n`);

    // Simulate search from a location in Pune (near Swargate)
    const userLat = 18.5018;
    const userLng = 73.8636;
    const maxRadius = 5000; // 5 km (increased from 1.5km)

    console.log(`📍 Searching from location: ${userLat}, ${userLng}`);
    console.log(`📏 Radius: ${maxRadius}m (5 km)\n`);

    // Query matching the backend logic
    const query = {
      status: { $in: ['open', 'partially_filled'] },
      availableSeats: { $gte: 1 },
      closedManually: false,
    };

    let trips = await Trip.find(query)
      .populate('user', 'name email profilePhoto rating role')
      .sort({ createdAt: -1 })
      .limit(200);

    console.log(`📊 Found ${trips.length} trips matching query in DB\n`);

    // Filter by proximity
    const R = 6371000;
    const nearbyTrips = trips.filter((trip) => {
      const dLat = ((trip.source.lat - userLat) * Math.PI) / 180;
      const dLng = ((trip.source.lng - userLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLat * Math.PI) / 180) *
          Math.cos((trip.source.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      
      console.log(`  Trip ${trip._id.toString().substring(0, 8)}... by ${trip.user.name} (${trip.user.role})`);
      console.log(`    Source: ${trip.source.landmark || trip.source.address.substring(0, 40)}`);
      console.log(`    Distance: ${Math.round(distance)}m`);
      console.log(`    Within radius: ${distance <= maxRadius ? '✅ YES' : '❌ NO'}\n`);
      
      return distance <= maxRadius;
    });

    console.log(`\n📍 After proximity filter: ${nearbyTrips.length} trips\n`);

    // Filter out own trips
    const notOwnTrips = nearbyTrips.filter(
      (trip) => trip.user._id.toString() !== rider._id.toString()
    );
    console.log(`👤 After removing own trips: ${notOwnTrips.length} trips\n`);

    // Apply visibility rules (rider can see ALL trips)
    const viewerRole = rider.role || 'user';
    let visibleTrips = notOwnTrips;
    
    if (viewerRole === 'driver') {
      visibleTrips = notOwnTrips.filter((trip) => trip.user.role !== 'driver');
      console.log(`🚗 Driver view: ${visibleTrips.length} trips (filtered out driver-posted)\n`);
    } else {
      console.log(`🧑‍💼 Rider view: ${visibleTrips.length} trips (showing ALL including driver-posted)\n`);
    }

    console.log('📋 Final visible trips:');
    visibleTrips.forEach((trip, i) => {
      console.log(`  ${i + 1}. ${trip.user.name} (${trip.user.role}): ${trip.source.landmark} → ${trip.destination.landmark}`);
      console.log(`     Status: ${trip.status}, Seats: ${trip.availableSeats}/${trip.seats}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testRiderSearch();
