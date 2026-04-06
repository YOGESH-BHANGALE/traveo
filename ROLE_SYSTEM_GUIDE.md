# Role System Guide - DITMATE+

## Overview
The DITMATE+ platform supports two user roles: **Riders** (users) and **Drivers**. All data is properly saved in the database with the correct role assignment.

---

## User Roles


### Rider (role: 'user')
- Can post trips to find travel companions
- Can view ALL trips (from both riders and drivers)
- Can connect with drivers and other riders
- Default role for new users



### Driver (role: 'driver')
- Can post trips/routes
- Can view trips posted by RIDERS only (not other drivers)
- Can manage auto sessions
- Has driver-specific fields (vehicle details, verification)
- Requires verification for badge

---

## Registration Flow

### Email/Password Registration

#### As Rider:
1. Go to `/auth/register`
2. Select "Sign up as Rider"
3. Fill in: name, email, phone, password
4. Role saved as: `user`

#### As Driver:
1. Go to `/auth/register`
2. Select "Sign up as Driver"
3. Fill in: name, email, phone, password, vehicle number, vehicle model
4. Role saved as: `driver`

### Google OAuth Registration

#### As Rider:
1. Go to `/auth/register`
2. Select "Sign up as Rider"
3. Click "Continue with Google"
4. Role saved as: `user`

#### As Driver:
1. Go to `/auth/register`
2. Select "Sign up as Driver"
3. Click "Continue with Google"
4. Role saved as: `driver`

**Note**: The role is passed as a state parameter in the OAuth URL and captured during user creation.

---

## Login Flow

### Email/Password Login
1. Go to `/auth/login`
2. Select role (UI only, doesn't affect actual role)
3. Enter credentials
4. System reads role from database
5. Redirects based on actual role:
   - Riders → `/dashboard`
   - Drivers → `/driver/dashboard`

### Google OAuth Login
1. Go to `/auth/login`
2. Select role (UI only)
3. Click "Continue with Google"
4. System reads role from database
5. Redirects based on actual role

---

## Driver Verification

To become a verified driver:

1. Navigate to `/driver/verify`
2. Submit:
   - Aadhar number (12 digits)
   - License number
   - Phone number (10 digits)
3. System automatically:
   - Sets `role: 'driver'`
   - Sets `isVerified: true`
   - Sets `driverVerification.verifiedBadge: true`
4. Driver badge appears on profile

---

## Database Schema

### User Model Fields

```javascript
{
  name: String,
  email: String,
  password: String,
  phone: String,
  role: String, // 'user' or 'driver'
  isVerified: Boolean,
  
  // Driver-specific fields
  driverMode: String, // 'car' or 'auto'
  vehicleNumber: String,
  vehicleModel: String,
  driverVerification: {
    aadharNumber: String,
    licenseNumber: String,
    mobileVerified: Boolean,
    submittedAt: Date,
    verifiedBadge: Boolean
  }
}
```

---

## Trip Visibility Rules

### When Rider Posts Trip
- ✅ Visible to ALL riders
- ✅ Visible to ALL drivers
- Real-time notification sent to everyone

### When Driver Posts Trip
- ✅ Visible to ALL riders
- ❌ NOT visible to other drivers
- Real-time notification sent to riders only

### Implementation
- **Server**: `searchTrips` controller filters based on viewer role
- **Client**: Socket event handlers filter `trip_nearby` events
- **Socket.io**: Emits `posterRole` with each trip notification

---

## API Endpoints

### Authentication
```
POST /api/auth/register
Body: { name, email, password, phone, role, vehicleNumber?, vehicleModel? }

POST /api/auth/login
Body: { email, password }

GET /api/auth/google
Query: ?state=user|driver

GET /api/auth/me
Returns: Current user with role
```

### Driver
```
POST /api/driver/verify
Body: { aadharNumber, licenseNumber, phone }
Effect: Sets role='driver', isVerified=true

GET /api/driver/dashboard
Returns: Driver-specific dashboard data
```

### Trips
```
POST /api/trips
Body: { source, destination, date, time, seats, vehicleType }
Effect: Creates trip, emits trip_nearby event with posterRole

GET /api/trips/search
Query: { userLat, userLng, radius }
Returns: Filtered trips based on viewer role
```

---

## Management Scripts

### List All Users
```bash
cd server
node scripts/listUsers.js
```

### Verify Database
```bash
cd server
node scripts/verifyDatabase.js
```

### Test Role System
```bash
cd server
node scripts/testRoleSystem.js
```

### Make User a Driver
```bash
cd server
node scripts/makeUserDriver.js <email>
```

### Fix Driver Roles (Migration)
```bash
cd server
node scripts/fixDriverRoles.js
```

---

## Troubleshooting

### User has wrong role
```bash
node scripts/makeUserDriver.js user@example.com
```

### Trip not showing correct badge
1. Check user role in database
2. Verify trip.user is populated with role field
3. Clear browser cache and refresh

### Google OAuth not saving role
1. Ensure role is selected before clicking Google button
2. Check browser console for state parameter in OAuth URL
3. Verify passport.js is reading req.query.state

### Real-time notifications not working
1. Check socket.io connection in browser console
2. Verify io instance is attached before routes load
3. Check posterRole is being emitted with trip_nearby event

---

## Testing Checklist

- [ ] Register as rider via email → role='user' ✅
- [ ] Register as driver via email → role='driver' ✅
- [ ] Register as rider via Google → role='user' ✅
- [ ] Register as driver via Google → role='driver' ✅
- [ ] Login redirects based on role ✅
- [ ] Driver verification sets role='driver' ✅
- [ ] Rider posts trip → visible to all ✅
- [ ] Driver posts trip → visible to riders only ✅
- [ ] Correct badge displayed ✅
- [ ] Real-time notifications work ✅

---

## Current Database State

```
Users: 3
├── Riders: 2
│   ├── Stake (stakedoubling@gmail.com)
│   └── Shashank (sasuu7392@gmail.com)
└── Drivers: 1
    └── Nandu Patil (nvasantpatil@gmail.com) ✓ Verified

Trips: 3
├── By Riders: 1
└── By Drivers: 2

All data properly saved with correct roles ✅
```

---

## Summary

✅ **All registration methods save role correctly**
- Email/password registration
- Google OAuth registration
- Driver verification

✅ **All data is persisted in database**
- User role
- Vehicle details (for drivers)
- Phone numbers
- Verification status

✅ **Role-based features work correctly**
- Trip visibility filtering
- Dashboard routing
- Badge display
- Real-time notifications

The system is production-ready with complete role management and data persistence.
