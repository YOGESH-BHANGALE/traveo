/**
 * Clean Database Script
 * Removes all data from the database for a fresh start
 * 
 * Usage: node server/scripts/cleanDatabase.js
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// Import all models
const User = require('../models/User');
const Trip = require('../models/Trip');
const Match = require('../models/Match');
const Ride = require('../models/Ride');
const Message = require('../models/Message');

async function cleanDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🗑️  Starting database cleanup...\n');

    // Delete all data from each collection
    const collections = [
      { name: 'Users', model: User },
      { name: 'Trips', model: Trip },
      { name: 'Matches', model: Match },
      { name: 'Rides', model: Ride },
      { name: 'Messages', model: Message }
    ];

    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      if (count > 0) {
        await collection.model.deleteMany({});
        console.log(`✅ Deleted ${count} ${collection.name}`);
      } else {
        console.log(`ℹ️  No ${collection.name} to delete`);
      }
    }

    console.log('\n✨ Database cleaned successfully!');
    console.log('\n📊 Current database state:');
    
    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      console.log(`   ${collection.name}: ${count}`);
    }

    console.log('\n✅ All done! Database is now empty and ready for fresh data.');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the cleanup
cleanDatabase();
