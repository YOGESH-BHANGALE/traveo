require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const rides = await db.collection('rides').find({}).toArray();
  console.log(`Total rides: ${rides.length}`);
  rides.forEach(r => console.log(`  ${r._id} | status: ${r.status} | code: ${r.rideCode}`));
  await mongoose.disconnect();
}
main().catch(console.error);
