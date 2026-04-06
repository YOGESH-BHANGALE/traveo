/**
 * Script to list all users
 * Usage: node scripts/listUsers.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({}).select('name email role isVerified driverVerification');
    
    console.log(`📋 Total users: ${users.length}\n`);
    
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.name}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Verified: ${u.isVerified}`);
      console.log(`   Driver Badge: ${u.driverVerification?.verifiedBadge || false}`);
      console.log('');
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

listUsers();
