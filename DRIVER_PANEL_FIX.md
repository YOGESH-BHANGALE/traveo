# Driver Panel Not Showing - Debug & Fix Guide

## Issue
After registering/logging in as Driver, the app shows Rider dashboard instead of Driver dashboard.

## Quick Debug Steps

### Step 1: Check User Role in Database
```bash
node server/scripts/checkUserRole.js your-email@example.com
```

**Expected Output**:
```
👤 User found:
   Name: Your Name
   Email: your-email@example.com
   Role: driver  ← Should be 'driver'
   
📊 Expected Dashboard:
   ✅ Should redirect to: /driver/dashboard
```

### Step 2: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for user data after login

**Expected**:
```javascript
{
  _id: "...",
  name: "Your Name",
  email: "your-email@example.com",
  role: "driver",  ← Should be 'driver'
  ...
}
```

### Step 3: Check LocalStorage
In browser console, run:
```javascript
JSON.parse(localStorage.getItem('ditmate_user'))
```

**Expected**:
```javascript
{
  role: "driver",  ← Should be 'driver'
  ...
}
```

## Common Issues & Fixes

### Issue 1: Role is 'user' instead of 'driver'

**Cause**: Registration didn't set role correctly

**Fix**:
```bash
# Update user role manually
node server/scripts/makeUserDriver.js your-email@example.com
```

### Issue 2: LocalStorage has old data

**Cause**: Browser cached old user data

**Fix**:
1. Open browser console (F12)
2. Run:
```javascript
localStorage.clear()
```
3. Refresh page
4. Login again

### Issue 3: Token has old user data

**Cause**: JWT token contains old role

**Fix**:
1. Logout completely
2. Clear browser cache (Ctrl+Shift+Delete)
3. Login again

## Testing New Registration

### Test 1: Register as Driver
1. Go to `/auth/register`
2. Click "Sign up as Driver" 🧑‍✈️
3. Fill in all fields including vehicle details
4. Click "Create Driver Account"
5. **Should redirect to**: `/driver/dashboard`

### Test 2: Check Database
```bash
node server/scripts/checkUserRole.js your-new-email@example.com
```

**Should show**:
```
Role: driver ✅
```

### Test 3: Check Browser
Open console and check:
```javascript
JSON.parse(localStorage.getItem('ditmate_user')).role
// Should return: "driver"
```

## Manual Fix Script

If user exists but has wrong role, create this script:

**File**: `server/scripts/fixUserRole.js`

```javascript
require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function fixUserRole() {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: node fixUserRole.js <email>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await User.findOne({ email });
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }

  console.log('Current role:', user.role);
  user.role = 'driver';
  await user.save();
  console.log('Updated role to: driver');

  await mongoose.connection.close();
  process.exit(0);
}

fixUserRole();
```

**Usage**:
```bash
node server/scripts/fixUserRole.js your-email@example.com
```

## Verification Checklist

After registration/login as Driver, verify:

- [ ] Browser console shows `role: "driver"`
- [ ] LocalStorage has `role: "driver"`
- [ ] URL is `/driver/dashboard` (not `/dashboard`)
- [ ] Bottom navigation shows driver options
- [ ] Can access driver-specific features

## Code Verification

### Backend (authController.js)
```javascript
// Line 48-50
const userData = {
  name, email, password, phone,
  role: role === 'driver' ? 'driver' : 'user',  ← Correct
};
```

### Frontend (register/page.js)
```javascript
// Line 40
const payload = {
  name: formData.name, email: formData.email,
  password: formData.password, phone: formData.phone,
  role: role || 'user',  ← Correct (role is 'driver' when selected)
};
```

### Frontend (login/page.js)
```javascript
// Line 31-33
const userData = await login(formData.email, formData.password, role);
if (userData?.role === 'driver') router.push('/driver/dashboard');
else router.push('/dashboard');  ← Correct
```

## If Still Not Working

### Debug Registration Request

1. Open browser DevTools (F12)
2. Go to Network tab
3. Register as Driver
4. Find `POST /api/auth/register` request
5. Check Request Payload:

**Should contain**:
```json
{
  "name": "Your Name",
  "email": "your-email@example.com",
  "password": "******",
  "phone": "+91...",
  "role": "driver",  ← Must be 'driver'
  "vehicleNumber": "...",
  "vehicleModel": "..."
}
```

6. Check Response:

**Should contain**:
```json
{
  "success": true,
  "token": "...",
  "user": {
    "role": "driver",  ← Must be 'driver'
    ...
  }
}
```

### Debug Login Request

1. Open Network tab
2. Login as Driver
3. Find `POST /api/auth/login` request
4. Check Request Payload:

**Should contain**:
```json
{
  "email": "your-email@example.com",
  "password": "******",
  "role": "driver"  ← Must be 'driver'
}
```

5. Check Response:

**Should contain**:
```json
{
  "success": true,
  "token": "...",
  "user": {
    "role": "driver",  ← Must be 'driver'
    ...
  }
}
```

## Summary

✅ **Backend code is correct** - Sets role properly  
✅ **Frontend code is correct** - Redirects based on role  
✅ **Most likely issue** - Old cached data or wrong role in database  

**Solution**:
1. Clear browser cache and localStorage
2. Check user role in database
3. Register fresh or update existing user role
4. Login again

If issue persists, provide:
- Browser console logs
- Network tab screenshots
- Database user document
