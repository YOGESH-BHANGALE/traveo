# Traveo Testing Checklist

## Current Status (April 14, 2026)

### Server Status
- ✅ Frontend: http://localhost:3000 - **RUNNING**
- ❌ Backend: http://localhost:5000 - **NEEDS MONGODB FIX**

## Pre-Testing Requirements

### 1. Fix MongoDB Connection
- [ ] Whitelist IP in MongoDB Atlas (see FIX_MONGODB_CONNECTION.md)
- [ ] Restart backend server
- [ ] Verify "MongoDB Connected Successfully" message

### 2. Verify Both Servers Running
```bash
# Terminal 1 - Backend
cd server
npm run dev
# Should show: Server running on port 5000

# Terminal 2 - Frontend  
cd client
npm run dev
# Should show: Ready on http://localhost:3000
```

## Feature Testing Checklist

### Authentication (Google OAuth)
- [ ] Click "Login with Google" button
- [ ] Redirects to Google consent screen
- [ ] After approval, redirects back to dashboard
- [ ] User profile shows name and photo
- [ ] JWT token stored in localStorage
- [ ] Logout works and clears token

### Trip Creation
- [ ] Navigate to "New Trip" page
- [ ] Source address autocomplete works (Google Places API)
- [ ] Destination address autocomplete works
- [ ] Date picker shows future dates
- [ ] Time picker works
- [ ] Seat selection (1-6) works
- [ ] Vehicle type selection works
- [ ] Submit creates trip successfully
- [ ] Redirects to trip details page

### Matching Algorithm
- [ ] Create 2-3 trips with nearby locations (within 1km)
- [ ] Click "Find Matches" button
- [ ] Shows matching trips with scores
- [ ] Distance difference displayed correctly
- [ ] Time difference displayed correctly
- [ ] Match score (0-100) calculated
- [ ] No matches shown for trips >1km or >30min apart
- [ ] Response time < 500ms

### Connection Requests
- [ ] Send connection request to matched trip
- [ ] Request appears in recipient's notifications
- [ ] Accept request creates ride
- [ ] Reject request removes match
- [ ] Cannot send duplicate requests

### Ride Management
- [ ] Accepted rides appear in "My Rides" page
- [ ] Shows all participants with photos
- [ ] Displays route on map
- [ ] Shows fare split per person
- [ ] Driver can start ride
- [ ] Status changes: confirmed → in_progress → completed

### Real-Time Chat (Socket.io)
- [ ] Open ride details page
- [ ] Chat interface loads
- [ ] Send message appears instantly
- [ ] Open same ride in another browser/device
- [ ] Messages sync in real-time
- [ ] Typing indicator shows when other user types
- [ ] Message latency < 100ms
- [ ] Messages persist after page refresh
- [ ] Chat disabled for completed/cancelled rides

### GPS Tracking
- [ ] Driver starts ride
- [ ] Click "Share Location" button
- [ ] Browser asks for location permission
- [ ] Allow location access
- [ ] Driver's marker appears on passenger's map
- [ ] Location updates every 5 seconds
- [ ] Marker moves smoothly on map
- [ ] Shows distance remaining
- [ ] Works on mobile devices

### Grouped Rides Feature
- [ ] Create trip with 3+ seats
- [ ] Multiple passengers book same trip
- [ ] Driver sees single grouped ride card
- [ ] Shows all passenger names and photos
- [ ] Individual chat with each passenger
- [ ] Fare split shown per passenger
- [ ] Can complete ride for all at once

### Driver Features
- [ ] Switch to driver mode in profile
- [ ] Add vehicle details (number, model)
- [ ] Submit driver verification (Aadhar, License)
- [ ] Post trip with available seats
- [ ] View booking requests
- [ ] Accept/reject passenger requests
- [ ] View earnings dashboard
- [ ] See completed rides history
- [ ] Rating from passengers visible

### Passenger Features
- [ ] Search for available trips
- [ ] Filter by date, time, vehicle type
- [ ] View driver profile and rating
- [ ] Book seat in available trip
- [ ] View booking confirmation
- [ ] Track driver location during ride
- [ ] Rate driver after completion
- [ ] View ride history

### Profile & Settings
- [ ] View own profile
- [ ] Edit name, phone, city
- [ ] Upload profile photo
- [ ] Add emergency contact
- [ ] View rating and total trips
- [ ] See reviews from other users
- [ ] Update password (if not Google OAuth)

### Maps Integration
- [ ] Google Maps loads correctly
- [ ] Autocomplete suggests addresses
- [ ] Clicking map sets location
- [ ] Route displayed between source and destination
- [ ] Distance calculation accurate
- [ ] Estimated time shown
- [ ] Works on mobile devices

### Notifications
- [ ] New match notification
- [ ] Connection request notification
- [ ] Ride accepted notification
- [ ] Ride started notification
- [ ] Message notification
- [ ] Rating request after ride

### PWA Features
- [ ] Install prompt appears on mobile
- [ ] Add to home screen works
- [ ] App icon shows on home screen
- [ ] Opens in standalone mode
- [ ] Offline page shows when no internet
- [ ] Service worker caches assets

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] Matching algorithm < 500ms
- [ ] Chat message latency < 100ms
- [ ] Location updates smooth (5 sec interval)
- [ ] No memory leaks after 30 min usage
- [ ] Works with 10+ concurrent users

### Security Testing
- [ ] Cannot access protected routes without login
- [ ] JWT token expires after 7 days
- [ ] Cannot book own trip
- [ ] Cannot send messages to non-ride members
- [ ] XSS protection works
- [ ] SQL injection prevented (MongoDB)
- [ ] Rate limiting prevents spam

### Mobile Responsiveness
- [ ] Works on iPhone (Safari)
- [ ] Works on Android (Chrome)
- [ ] Touch gestures work
- [ ] Bottom navigation accessible
- [ ] Forms easy to fill on mobile
- [ ] Maps pinch-to-zoom works
- [ ] Chat keyboard doesn't hide input

### Error Handling
- [ ] Invalid login shows error message
- [ ] Network error shows toast notification
- [ ] Empty search results handled gracefully
- [ ] Invalid coordinates rejected
- [ ] Expired trips cannot be booked
- [ ] Full trips show "No seats available"

## Demo Preparation

### Before Presentation
1. [ ] Clear browser cache and localStorage
2. [ ] Create 2-3 test accounts
3. [ ] Pre-create some trips for demo
4. [ ] Test on presentation laptop
5. [ ] Have backup screenshots ready
6. [ ] Charge laptop and phone fully
7. [ ] Test internet connection at venue

### Demo Flow (5-7 minutes)
1. **Login** (30 sec) - Show Google OAuth
2. **Create Trip** (1 min) - Show autocomplete and form
3. **Find Matches** (1 min) - Explain algorithm and scores
4. **Send Request** (30 sec) - Show connection flow
5. **Real-time Chat** (1 min) - Demo instant messaging
6. **GPS Tracking** (1 min) - Show live location updates
7. **Grouped Rides** (1 min) - Show driver view
8. **Q&A** (remaining time)

### Backup Plan
- [ ] Screenshots of all features
- [ ] Video recording of working demo
- [ ] Localhost demo if internet fails
- [ ] Presentation slides with architecture

## Known Issues (Document These)

1. **MongoDB Connection**: Requires IP whitelisting
2. **Google Maps API**: Limited to 1000 requests/day (free tier)
3. **Payment Integration**: Not implemented (future scope)
4. **Driver Verification**: Demo only, no real ID validation
5. **Push Notifications**: Basic implementation, needs testing

## Post-Testing

- [ ] Document all bugs found
- [ ] Fix critical issues before presentation
- [ ] Update README with setup instructions
- [ ] Prepare answers for common questions
- [ ] Practice demo 3-4 times

## Success Criteria

✅ All core features working
✅ No crashes during demo
✅ Response times meet targets (<500ms matching, <100ms chat)
✅ Mobile responsive
✅ Real-time features work smoothly
✅ Can explain technical implementation confidently
