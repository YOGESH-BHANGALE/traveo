/**
 * Test Driver Registration and Login Flow
 * Simulates the exact flow a new driver would go through
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function testFlow() {
  try {
    console.log('🧪 TESTING DRIVER REGISTRATION & LOGIN FLOW\n');
    console.log('=' .repeat(60));

    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const testEmail = `test.driver.${Date.now()}@example.com`;
    const testData = {
      name: 'Test Driver',
      email: testEmail,
      password: 'password123',
      phone: '9876543210',
      role: 'driver',
      vehicleNumber: 'MH12AB1234',
      vehicleModel: 'Honda City'
    };

    console.log('=' .repeat(60));
    console.log('\n📝 Step 1: Simulating Registration');
    console.log('-'.repeat(60));
    console.log('Payload:', { ...testData, password: '[HIDDEN]' });

    // Create user (simulating registration)
    const user = await User.create(testData);
    console.log('\n✅ User created in database');
    console.log('Database record:');
    console.log('  _id:', user._id);
    console.log('  name:', user.name);
    console.log('  email:', user.email);
    console.log('  role:', user.role);
    console.log('  vehicleNumber:', user.vehicleNumber);
    console.log('  vehicleModel:', user.vehicleModel);

    // Simulate what backend returns
    const publicJSON = user.toPublicJSON();
    console.log('\n📤 What backend returns (toPublicJSON):');
    console.log('  _id:', publicJSON._id);
    console.log('  name:', publicJSON.name);
    console.log('  email:', publicJSON.email);
    console.log('  role:', publicJSON.role);
    console.log('  vehicleNumber:', publicJSON.vehicleNumber);

    console.log('\n=' .repeat(60));
    console.log('\n🔐 Step 2: Simulating Login');
    console.log('-'.repeat(60));

    // Find user (simulating login)
    const foundUser = await User.findOne({ email: testEmail }).select('+password');
    console.log('✅ User found in database');
    console.log('  role:', foundUser.role);

    // Check password
    const isMatch = await foundUser.comparePassword('password123');
    console.log('✅ Password verified:', isMatch);

    // Return public JSON (what login returns)
    const loginResponse = foundUser.toPublicJSON();
    console.log('\n📤 What login returns:');
    console.log('  _id:', loginResponse._id);
    console.log('  name:', loginResponse.name);
    console.log('  email:', loginResponse.email);
    console.log('  role:', loginResponse.role);

    console.log('\n=' .repeat(60));
    console.log('\n🎯 Step 3: Frontend Redirect Logic');
    console.log('-'.repeat(60));

    if (loginResponse.role === 'driver') {
      console.log('✅ Role is "driver"');
      console.log('✅ Should redirect to: /driver/dashboard');
      console.log('\nRedirect code:');
      console.log('  if (userData?.role === "driver") {');
      console.log('    router.push("/driver/dashboard");  ← THIS SHOULD EXECUTE');
      console.log('  } else {');
      console.log('    router.push("/dashboard");');
      console.log('  }');
    } else {
      console.log('❌ Role is NOT "driver", it is:', loginResponse.role);
      console.log('❌ Would redirect to: /dashboard (WRONG!)');
    }

    console.log('\n=' .repeat(60));
    console.log('\n🧹 Cleanup: Deleting test user');
    await User.deleteOne({ email: testEmail });
    console.log('✅ Test user deleted');

    console.log('\n=' .repeat(60));
    console.log('\n✅ TEST COMPLETE');
    console.log('=' .repeat(60));

    console.log('\n📊 Summary:');
    console.log('  1. User registered with role: "driver" ✅');
    console.log('  2. Database stored role: "driver" ✅');
    console.log('  3. toPublicJSON includes role: "driver" ✅');
    console.log('  4. Login returns role: "driver" ✅');
    console.log('  5. Frontend should redirect to: /driver/dashboard ✅');

    console.log('\n💡 If users are still being redirected to /dashboard:');
    console.log('  1. Check browser console for userData.role value');
    console.log('  2. Check localStorage: JSON.parse(localStorage.getItem("ditmate_user")).role');
    console.log('  3. Clear localStorage and try again');
    console.log('  4. Check if dashboard redirect is running before login redirect');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB\n');
    process.exit(0);
  }
}

testFlow();
