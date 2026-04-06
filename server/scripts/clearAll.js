/**
 * Clears ALL data from the database — fresh start.
 * Run: node server/scripts/clearAll.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  const db = mongoose.connection.db;

  const collections = ['users', 'trips', 'rides', 'messages', 'matches', 'payments', 'bookings', 'autos'];
  for (const col of collections) {
    const res = await db.collection(col).deleteMany({});
    console.log(`Deleted ${res.deletedCount} documents from [${col}]`);
  }

  console.log('\nDatabase fully cleared. Ready for fresh start.');
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
