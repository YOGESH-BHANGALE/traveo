/**
 * Clears ALL rides, messages, matches and resets trips for all users.
 * Run once: node server/scripts/clearHistory.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // 1. Delete ALL rides
  const rideResult = await db.collection('rides').deleteMany({});
  console.log(`Deleted ${rideResult.deletedCount} rides`);

  // 2. Delete ALL messages
  const msgResult = await db.collection('messages').deleteMany({});
  console.log(`Deleted ${msgResult.deletedCount} messages`);

  // 3. Reset ALL matches to pending
  const matchResult = await db.collection('matches').deleteMany({});
  console.log(`Deleted ${matchResult.deletedCount} matches`);

  // 4. Reset ALL trips to active
  const tripResult = await db.collection('trips').updateMany(
    {},
    { $set: { status: 'active' } }
  );
  console.log(`Reset ${tripResult.modifiedCount} trips to active`);

  console.log('\nAll done. Database is fully clean.');
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
