const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('matches');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('📊 Current indexes on matches collection:\n');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}`);
      console.log(`   Keys:`, JSON.stringify(index.key));
      if (index.unique) console.log(`   Unique: true`);
      console.log('');
    });

    // Check for the problematic index
    const problematicIndex = indexes.find(idx => idx.name === 'trip_1_matchedTrip_1');
    
    if (problematicIndex) {
      console.log('⚠️  Found problematic index: trip_1_matchedTrip_1');
      console.log('   This index prevents multiple riders from connecting to the same trip\n');
      
      console.log('🔄 Dropping old index...');
      await collection.dropIndex('trip_1_matchedTrip_1');
      console.log('✅ Old index dropped successfully\n');
    } else {
      console.log('✅ No problematic index found\n');
    }

    // Verify correct index exists
    const correctIndex = indexes.find(idx => idx.name === 'trip_1_matchedUser_1');
    if (correctIndex) {
      console.log('✅ Correct index exists: trip_1_matchedUser_1');
      console.log('   This allows multiple riders to connect to the same trip\n');
    } else {
      console.log('⚠️  Correct index not found. Creating it...');
      await collection.createIndex({ trip: 1, matchedUser: 1 }, { unique: true });
      console.log('✅ Correct index created\n');
    }

    // Show final indexes
    const finalIndexes = await collection.indexes();
    console.log('📊 Final indexes:\n');
    finalIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}`);
      console.log(`   Keys:`, JSON.stringify(index.key));
      if (index.unique) console.log(`   Unique: true`);
      console.log('');
    });

    console.log('✅ Index fix complete!');
    console.log('\n💡 Multiple riders can now connect to the same trip');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixIndexes();
