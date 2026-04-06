/**
 * Check User Role Script
 * Verifies user roles in database
 * 
 * Usage: node server/scripts/checkUserRole.js <email>
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUserRole() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.log('Usage: node server/scripts/checkUserRole.js <email>');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    console.log(`🔍 Looking for user: ${email}\n`);

    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('👤 User found:');
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Phone:', user.phone || 'Not set');
    console.log('   Vehicle Number:', user.vehicleNumber || 'Not set');
    console.log('   Vehicle Model:', user.vehicleModel || 'Not set');
    console.log('   Created:', user.createdAt);

    console.log('\n📊 Expected Dashboard:');
    if (user.role === 'driver') {
      console.log('   ✅ Should redirect to: /driver/dashboard');
    } else {
      console.log('   ✅ Should redirect to: /dashboard');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

checkUserRole();
