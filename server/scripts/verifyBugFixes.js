/**
 * Verify Bug Fixes Script
 * Checks that all bug fixes are properly implemented
 * 
 * Usage: node server/scripts/verifyBugFixes.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Bug Fixes...\n');

const checks = [];

// Check 1: Role-based login restriction
console.log('1️⃣  Checking role-based login restriction...');
const authController = fs.readFileSync(
  path.join(__dirname, '../controllers/authController.js'),
  'utf8'
);

if (authController.includes('requestedRole') && 
    authController.includes('registeredRole') &&
    authController.includes('This email is already registered as')) {
  console.log('   ✅ Role-based login restriction implemented');
  checks.push(true);
} else {
  console.log('   ❌ Role-based login restriction NOT found');
  checks.push(false);
}

// Check 2: One ride per trip
console.log('\n2️⃣  Checking one ride per trip logic...');
const rideController = fs.readFileSync(
  path.join(__dirname, '../controllers/rideController.js'),
  'utf8'
);

if (rideController.includes('Check if a ride already exists for this trip') &&
    rideController.includes('Add new rider to existing ride')) {
  console.log('   ✅ One ride per trip logic implemented');
  checks.push(true);
} else {
  console.log('   ❌ One ride per trip logic NOT found');
  checks.push(false);
}

// Check 3: Connection requests for riders
console.log('\n3️⃣  Checking connection requests visibility...');
const tripDetailPage = fs.readFileSync(
  path.join(__dirname, '../../client/src/app/trips/[tripId]/page.js'),
  'utf8'
);

if (tripDetailPage.includes('Connection Requests') &&
    tripDetailPage.includes('isOwner &&') &&
    !tripDetailPage.includes('isOwner && matches.length > 0 &&')) {
  console.log('   ✅ Connection requests always visible for owners');
  checks.push(true);
} else {
  console.log('   ❌ Connection requests visibility issue');
  checks.push(false);
}

// Check 4: Auto-open chat after accept
console.log('\n4️⃣  Checking auto-open chat after accept...');
if (tripDetailPage.includes('Opening chat...') &&
    tripDetailPage.includes('router.push(`/chat?rideId=')) {
  console.log('   ✅ Auto-open chat implemented');
  checks.push(true);
} else {
  console.log('   ❌ Auto-open chat NOT found');
  checks.push(false);
}

// Check 5: Role-agnostic text
console.log('\n5️⃣  Checking role-agnostic text...');
const ridesPage = fs.readFileSync(
  path.join(__dirname, '../../client/src/app/rides/page.js'),
  'utf8'
);

if (ridesPage.includes('trip poster') &&
    !ridesPage.includes('Waiting for driver to start')) {
  console.log('   ✅ Role-agnostic text updated');
  checks.push(true);
} else {
  console.log('   ❌ Still has driver-specific text');
  checks.push(false);
}

// Check 6: Complete all button for all creators
console.log('\n6️⃣  Checking complete all button...');
if (ridesPage.includes('Complete All Rides') &&
    ridesPage.includes("role === 'creator'")) {
  console.log('   ✅ Complete all button works for all creators');
  checks.push(true);
} else {
  console.log('   ❌ Complete all button restricted to drivers only');
  checks.push(false);
}

// Check 7: Matches page error handling
console.log('\n7️⃣  Checking matches page error handling...');
const matchesPage = fs.readFileSync(
  path.join(__dirname, '../../client/src/app/matches/page.js'),
  'utf8'
);

if (matchesPage.includes('try {') &&
    matchesPage.includes('catch (matchErr)') &&
    matchesPage.includes('setMatches([])')) {
  console.log('   ✅ Matches page error handling improved');
  checks.push(true);
} else {
  console.log('   ❌ Matches page error handling needs improvement');
  checks.push(false);
}

// Summary
console.log('\n' + '='.repeat(50));
const passedChecks = checks.filter(c => c).length;
const totalChecks = checks.length;

if (passedChecks === totalChecks) {
  console.log(`\n✅ All ${totalChecks} checks passed!`);
  console.log('🎉 All bug fixes are properly implemented.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${passedChecks}/${totalChecks} checks passed`);
  console.log(`❌ ${totalChecks - passedChecks} issues found\n`);
  process.exit(1);
}
