# Debug Driver Login Issue

## Current Situation
- User "Nandu" logs in as Driver
- URL shows: `localhost:3000/dashboard` (Rider dashboard)
- Expected: `localhost:3000/driver/dashboard` (Driver dashboard)

## Diagnostic Steps

### Step 1: Check Browser Console
Open browser console (F12) and run these commands:

```javascript
// Check user data in localStorage
const user = JSON.parse(localStorage.getItem('ditmate_user'));
console.log('User Role:', user.role);
console.log('User Data:', user);

// Check if redirect should happen
if (user.role === 'driver') {
  console.log('✅ User is driver - should redirect to /driver/dashboard');
} else {
  console.log('❌ User is NOT driver - role is:', user.role);
}
```

### Step 2: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Login again
4. Find the `POST /api/auth/login` request
5. Check the Response

**Expected Response**:
```json
{
  "success": true,
  "token": "...",
  "user": {
    "_id": "...",
    "name": "Nandu",
    "email": "...",
    "role": "driver",  ← MUST be "driver"
    ...
  }
}
```

If `role` is NOT "driver", then the backend is returning wrong data.

### Step 3: Check Database
```bash
node server/scripts/checkUserRole.js nandu-email@example.com
```

**Expected**:
```
Role: driver ✅
```

If role is "user", then database has wrong data.

## Possible Issues

### Issue 1: User has wrong role in database
**Symptom**: Database shows `role: 'user'` instead of `role: 'driver'`

**Fix**:
```bash
node server/scripts/makeUserDriver.js nandu-email@example.com
```

Then logout and login again.

### Issue 2: Login not sending role parameter
**Symptom**: Backend doesn't know which role to validate

**Check**: In Network tab, look at login request payload:
```json
{
  "email": "...",
  "password": "...",
  "role": "driver"  ← Must be present
}
```

### Issue 3: Frontend redirect not working
**Symptom**: User data is correct but redirect doesn't happen

**Fix**: Already added console.log to dashboard page. Check console for:
```
Redirecting driver to /driver/dashboard
```

If you see this message but still on `/dashboard`, there's a routing issue.

### Issue 4: User object not loaded when redirect runs
**Symptom**: `user` is null/undefined when useEffect runs

**Fix**: Already added `user?.role` to dependency array.

## Quick Test

### Test in Browser Console
While on `/dashboard`, run:

```javascript
// Force redirect
const user = JSON.parse(localStorage.getItem('ditmate_user'));
if (user.role === 'driver') {
  window.location.href = '/driver/dashboard';
}
```

If this works, then the automatic redirect just needs to be triggered.

## Manual Fix

If automatic redirect doesn't work, you can manually navigate:

1. Type in address bar: `localhost:3000/driver/dashboard`
2. Press Enter
3. You should see Driver dashboard

If Driver dashboard loads manually but not automatically, then the redirect logic needs adjustment.

## Code Changes Made

### File: `client/src/app/dashboard/page.js`

**Added**:
```javascript
useEffect(() => {
  if (!authLoading && !isAuthenticated) { 
    router.push('/auth/login'); 
    return; 
  }
  if (!isAuthenticated) return;

  // Redirect drivers to their dashboard
  if (user?.role === 'driver') {
    console.log('Redirecting driver to /driver/dashboard');  // ← Debug log
    router.push('/driver/dashboard');
    return;
  }
  
  // ... rest of code
}, [isAuthenticated, authLoading, user?.role]);  // ← Added user?.role
```

## Next Steps

1. **Check browser console** - Look for "Redirecting driver to /driver/dashboard" message
2. **Check user role** - Run `JSON.parse(localStorage.getItem('ditmate_user')).role`
3. **Check database** - Run `node server/scripts/checkUserRole.js email`
4. **Report findings** - Tell me what you see in console and what role shows

This will help identify exactly where the issue is.
