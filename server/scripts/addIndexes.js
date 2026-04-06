/**
 * Add Database Indexes Script
 * Creates indexes to improve query performance
 * 
 * Usage: node server/scripts/addIndexes.js
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// Import all models
const User = require('../models/User');
const Trip = require('../models/Trip');
const Match = require('../models/Match');
const Ride = require('../models/Ride');
const Message = require('../models/Message');

async function addIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Creating indexes...\n');

    // User indexes
    console.log('Creating User indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ googleId: 1 }, { sparse: true });
    console.log('✅ User indexes created');

    // Trip indexes
    console.log('Creating Trip indexes...');
    await Trip.collection.createIndex({ user: 1 });
    await Trip.collection.createIndex({ status: 1 });
    await Trip.collection.createIndex({ date: 1 });
    await Trip.collection.createIndex({ 'source.coordinates': '2dsphere' });
    await Trip.collection.createIndex({ 'destination.coordinates': '2dsphere' });
    await Trip.collection.createIndex({ user: 1, status: 1 });
    await Trip.collection.createIndex({ status: 1, date: 1 });
    console.log('✅ Trip indexes created');

    // Match indexes
    console.log('Creating Match indexes...');
    await Match.collection.createIndex({ trip: 1, matchedUser: 1 }, { unique: true });
    await Match.collection.createIndex({ trip: 1 });
    await Match.collection.createIndex({ matchedUser: 1 });
    await Match.collection.createIndex({ requestedBy: 1 });
    await Match.collection.createIndex({ status: 1 });
    await Match.collection.createIndex({ trip: 1, status: 1 });
    console.log('✅ Match indexes created');

    // Ride indexes
    console.log('Creating Ride indexes...');
    await Ride.collection.createIndex({ rideCode: 1 }, { unique: true });
    await Ride.collection.createIndex({ 'users.user': 1 });
    await Ride.collection.createIndex({ trips: 1 });
    await Ride.collection.createIndex({ status: 1 });
    await Ride.collection.createIndex({ 'users.user': 1, status: 1 });
    await Ride.collection.createIndex({ trips: 1, status: 1 });
    console.log('✅ Ride indexes created');

    // Message indexes
    console.log('Creating Message indexes...');
    await Message.collection.createIndex({ ride: 1 });
    await Message.collection.createIndex({ sender: 1 });
    await Message.collection.createIndex({ ride: 1, createdAt: 1 });
    console.log('✅ Message indexes created');

    console.log('\n✨ All indexes created successfully!');
    
    // List all indexes
    console.log('\n📋 Current indexes:');
    const collections = [
      { name: 'Users', model: User },
      { name: 'Trips', model: Trip },
      { name: 'Matches', model: Match },
      { name: 'Rides', model: Ride },
      { name: 'Messages', model: Message }
    ];

    for (const collection of collections) {
      const indexes = await collection.model.collection.getIndexes();
      console.log(`\n${collection.name}:`);
      Object.keys(indexes).forEach(indexName => {
        console.log(`  - ${indexName}`);
      });
    }

    console.log('\n✅ Database is now optimized for fast queries!');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
addIndexes();
