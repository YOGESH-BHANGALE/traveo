# Testing Guide - Driver & Rider Trip Visibility

## Quick Test Steps

### Test 1: Driver Posts Trip
1. Login as driver (Nandu Patil)
2. Navigate to driver dashboard
3. Click "Post Trip" or "New Trip"
4. Fill in trip details:
   - Source: Any location in Pune
   - Destination: Any location in Pune
   - Date: Today or future date
   - Time: Any time
   - Seats: 2-4 seats
   - Vehicle type: Car/Auto/Bike
5. Submit the trip
6. Verify trip appears in "My Posted Trips" section

### Test 2: Rider Sees Driver Trip
1. Login as rider (Stake or Shashank)
2. Navigate to "Explore" page
3. Allow location access when prompted
4. Wait for location to be detected (green indicator: "Within 5 km · live")
5. Verify driver-posted trips appear in the list
6. Look for trips with "🧑‍✈️ Driver" badge
7. Verify you can see trip details:
   - Driver name
   - Source and destination
   - Available seats
   - Estimated fare
   - Vehicle type

### Test 3: Rider Connects to Driver Trip
1. As rider, find a driver-posted trip in explore page
2. Click "Connect" button
3. Verify button changes to "Sent" with checkmark
4. Verify toast notification: "Request sent to [Driver Name]!"
5. Navigate to "Matches" or "My Requests" page
6. Verify connection request appears in the list

### Test 4: Driver Sees Booking Request
1. Login as driver
2. Navigate to driver dashboard
3. Check "My Posted Trips" section
4. Click on the trip that received a connection request
5. Verify you can see:
   - Trip details
   - List of confirmed bookings
   - Rider information (name, profile photo)
   - Number of seats booked
6. Verify "Start Trip" and "Close Trip" buttons are available

### Test 5: Distance Filtering
1. Login as rider
2. Go to explore page
3. Note your current location
4. Verify only trips within 5 km radius are shown
5. If no trips appear, check:
   - Location permission is granted
   - Green "Within 5 km · live" indicator is showing
   - There are active trips in the database

## Expected Behavior

### Visibility Rules
✅ **Riders can see:**
- All rider-posted trips
- All driver-posted trips
- Within 5 km radius of their location

✅ **Drivers can see:**
- Only rider-posted trips
- NOT other driver-posted trips
- Within 5 km radius of their location

✅ **Everyone:**
- Cannot see their own trips in explore
- Can only see trips with status: 'open' or 'partially_filled'
- Can only see trips with available seats > 0
- Cannot see manually closed trips

### Search Radius
- Default: 5 km (5000 meters)
- Trips outside this radius will not appear
- Location must be enabled for trips to show

## Troubleshooting

### No Trips Showing
1. **Check location permission**
   - Browser should prompt for location access
   - Look for green "Within 5 km · live" indicator
   - If red/amber, location is not working

2. **Check trip distance**
   - Run: `node server/scripts/getTripCoords.js`
   - Compare trip coordinates with your location
   - Ensure distance is less than 5 km

3. **Check trip status**
   - Run: `node server/scripts/checkTripsVisibility.js`
   - Verify trips have status: 'open' or 'partially_filled'
   - Verify availableSeats >= 1
   - Verify closedManually: false

4. **Check role filtering**
   - If logged in as driver, you won't see other driver trips
   - If logged in as rider, you should see ALL trips

### Connection Request Not Working
1. Check if you already sent a request (button shows "Sent")
2. Verify trip has available seats
3. Check if trip is still active (not started/closed)
4. Verify you're not trying to connect to your own trip

### Real-time Updates Not Working
1. Check Socket.io connection in browser console
2. Verify backend server is running on port 5000
3. Check for Socket.io connection logs in backend terminal
4. Refresh the page to reconnect

## Diagnostic Scripts

### Check Trip Visibility
```bash
cd server
node scripts/checkTripsVisibility.js
```
Shows all recent trips with their visibility status.

### Test Rider Search
```bash
cd server
node scripts/testRiderSearch.js
```
Simulates a rider search from a specific location.

### Get Trip Coordinates
```bash
cd server
node "scripts/getTripCoords.js"
```
Shows coordinates of an open trip for distance verification.

## Database Queries

### Check All Open Trips
```javascript
// In MongoDB shell or Compass
db.trips.find({
  status: { $in: ['open', 'partially_filled'] },
  availableSeats: { $gte: 1 },
  closedManually: false
}).sort({ createdAt: -1 })
```

### Check User Roles
```javascript
db.users.find({}, { name: 1, email: 1, role: 1 })
```

### Check Trip with Bookings
```javascript
db.trips.findOne({ _id: ObjectId('TRIP_ID') })
```

## Test Accounts

### Driver Account
- Name: Nandu Patil
- Email: nvasantpatil@gmail.com
- Role: driver

### Rider Accounts
- Name: Stake
- Email: stakedoubling@gmail.com
- Role: user

- Name: Shashank
- Email: sasuu7392@gmail.com
- Role: user

## Server URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Base: http://localhost:5000/api

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "No rides nearby" | Check location permission and trip distance |
| Driver trips not visible | Verify search radius is 5 km, not 1.5 km |
| Can't connect to trip | Check if trip is still open and has seats |
| Real-time updates not working | Verify Socket.io connection |
| Location not detected | Enable browser location permission |
| Trips showing wrong role | Check user role in database |

## Success Indicators

✅ Location detected (green indicator)
✅ Trips appear in explore page
✅ Driver badge shows on driver-posted trips
✅ Connect button works
✅ Request appears in matches
✅ Driver sees bookings
✅ Real-time notifications work

## Next Steps After Testing

1. If all tests pass, system is working correctly
2. If issues found, check troubleshooting section
3. Run diagnostic scripts for detailed information
4. Check server logs for errors
5. Verify database state with queries

## Support

For issues or questions:
1. Check `TRIP_VISIBILITY_FIX.md` for detailed fix documentation
2. Check `IMPLEMENTATION_SUMMARY.md` for system overview
3. Check `FLEXIBLE_BOOKING_SYSTEM.md` for booking system details
4. Run diagnostic scripts for troubleshooting
