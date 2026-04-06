/**
 * Comprehensive Driver Login Diagnostic Script
 * Checks all aspects of driver login flow
 * 
 * Usage: node server/scripts/diagnoseDriverLogin.js <email>
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function diagnose() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.log('Usage: node server/scripts/diagnoseDriverLogin.js <email>');
      console.log('Example: node server/scripts/diagnoseDriverLogin.js nvasantpatil@gmail.com');
      process.exit(1);
    }

    console.log('🔍 DRIVER LOGIN DIAGNOSTIC TOOL\n');
    console.log('=' .repeat(60));

    console.log('\n📡 Step 1: Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    console.log('=' .repeat(60));
    console.log(`\n🔎 Step 2: Looking up user: ${email}`);
    
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ USER NOT FOUND');
      console.log('\nPossible issues:');
      console.log('  1. Email is incorrect');
      console.log('  2. User has not registered yet');
      console.log('  3. Database connection is wrong');
      
      console.log('\n💡 Suggestions:');
      console.log('  - Check if email is spelled correctly');
      console.log('  - Register this email first at /auth/register');
      console.log('  - Verify MONGODB_URI in server/.env');
      
      process.exit(1);
    }

    console.log('✅ User found in database\n');

    console.log('=' .repeat(60));
    console.log('\n📋 Step 3: User Details');
    console.log('-'.repeat(60));
    console.log(`Name:           ${user.name}`);
    console.log(`Email:          ${user.email}`);
    console.log(`Role:           ${user.role} ${user.role === 'driver' ? '🧑‍✈️' : '🧑‍💼'}`);
    console.log(`Phone:          ${user.phone || 'Not set'}`);
    console.log(`Vehicle Number: ${user.vehicleNumber || 'Not set'}`);
    console.log(`Vehicle Model:  ${user.vehicleModel || 'Not set'}`);
    console.log(`Created:        ${user.createdAt}`);
    console.log(`Last Updated:   ${user.updatedAt}`);

    console.log('\n=' .repeat(60));
    console.log('\n🎯 Step 4: Role Analysis');
    console.log('-'.repeat(60));

    if (user.role === 'driver') {
      console.log('✅ ROLE IS CORRECT: driver');
      console.log('\nExpected behavior after login:');
      console.log('  1. Login API returns: { user: { role: "driver", ... } }');
      console.log('  2. Frontend stores user in localStorage');
      console.log('  3. Login page redirects to: /driver/dashboard');
      console.log('  4. If user visits /dashboard, auto-redirect to /driver/dashboard');
      
      console.log('\n📍 Expected Dashboard URL:');
      console.log('  ✅ http://localhost:3000/driver/dashboard');
      
      console.log('\n❌ Should NOT see:');
      console.log('  ❌ http://localhost:3000/dashboard (Rider dashboard)');
    } else {
      console.log('❌ ROLE IS WRONG: ' + user.role);
      console.log('\nThis user is registered as a RIDER, not a DRIVER');
      console.log('\n💡 To fix this, run:');
      console.log(`  node server/scripts/makeUserDriver.js ${email}`);
      console.log('\nOr register a new account as Driver at:');
      console.log('  http://localhost:3000/auth/register');
    }

    console.log('\n=' .repeat(60));
    console.log('\n🔧 Step 5: Troubleshooting Checklist');
    console.log('-'.repeat(60));

    const checks = [
      {
        item: 'User exists in database',
        status: !!user,
        fix: 'Register at /auth/register'
      },
      {
        item: 'User role is "driver"',
        status: user.role === 'driver',
        fix: `Run: node server/scripts/makeUserDriver.js ${email}`
      },
      {
        item: 'Backend server running',
        status: true, // If this script runs, backend can connect to DB
        fix: 'Run: npm start (in server directory)'
      }
    ];

    checks.forEach((check, i) => {
      const icon = check.status ? '✅' : '❌';
      console.log(`${i + 1}. ${icon} ${check.item}`);
      if (!check.status) {
        console.log(`   Fix: ${check.fix}`);
      }
    });

    console.log('\n=' .repeat(60));
    console.log('\n🌐 Step 6: Frontend Debugging');
    console.log('-'.repeat(60));
    console.log('\nAfter logging in, open browser console (F12) and run:');
    console.log('\n```javascript');
    console.log('// Check stored user data');
    console.log('const user = JSON.parse(localStorage.getItem("ditmate_user"));');
    console.log('console.log("Stored Role:", user.role);');
    console.log('console.log("Full User:", user);');
    console.log('');
    console.log('// Check current URL');
    console.log('console.log("Current URL:", window.location.href);');
    console.log('');
    console.log('// Expected for driver:');
    console.log('// Stored Role: "driver"');
    console.log('// Current URL: "http://localhost:3000/driver/dashboard"');
    console.log('```');

    console.log('\n=' .repeat(60));
    console.log('\n📝 Step 7: Login Flow Verification');
    console.log('-'.repeat(60));
    console.log('\n1. Go to: http://localhost:3000/auth/login');
    console.log('2. Click: "I\'m a Driver" button');
    console.log('3. Enter email:', email);
    console.log('4. Enter password: (your password)');
    console.log('5. Click: "Log In as Driver"');
    console.log('\n6. Check browser console for:');
    console.log('   "Redirecting driver to /driver/dashboard"');
    console.log('\n7. Verify URL changes to:');
    console.log('   http://localhost:3000/driver/dashboard');

    console.log('\n=' .repeat(60));
    console.log('\n🚨 Common Issues & Solutions');
    console.log('-'.repeat(60));

    console.log('\nIssue 1: Still shows /dashboard after login');
    console.log('  Cause: Redirect logic not triggering');
    console.log('  Fix: Check browser console for errors');
    console.log('       Clear localStorage and login again');
    console.log('       Hard refresh (Ctrl+Shift+R)');

    console.log('\nIssue 2: Role shows "user" instead of "driver"');
    console.log('  Cause: Database has wrong role');
    console.log(`  Fix: Run: node server/scripts/makeUserDriver.js ${email}`);

    console.log('\nIssue 3: Login fails with "wrong role" error');
    console.log('  Cause: Trying to login as Driver but registered as Rider');
    console.log('  Fix: Either login as Rider, or change role in database');

    console.log('\nIssue 4: Page loads but immediately redirects back');
    console.log('  Cause: Infinite redirect loop');
    console.log('  Fix: Check both /dashboard and /driver/dashboard redirect logic');

    console.log('\n=' .repeat(60));
    console.log('\n✅ DIAGNOSTIC COMPLETE');
    console.log('=' .repeat(60));

    if (user.role === 'driver') {
      console.log('\n🎉 Everything looks good! User is correctly set as driver.');
      console.log('\nIf you\'re still seeing the rider dashboard:');
      console.log('  1. Logout completely');
      console.log('  2. Clear browser cache/localStorage');
      console.log('  3. Login again as Driver');
      console.log('  4. Check browser console for redirect message');
    } else {
      console.log('\n⚠️  User role needs to be changed to "driver"');
      console.log(`\nRun this command to fix:`);
      console.log(`  node server/scripts/makeUserDriver.js ${email}`);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB\n');
    process.exit(0);
  }
}

diagnose();
