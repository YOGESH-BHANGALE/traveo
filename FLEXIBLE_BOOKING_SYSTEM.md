# Flexible Seat Booking System - Implementation Guide

## Overview
The flexible seat booking system allows drivers to post trips with multiple seats and gives them full control over when to start the trip, whether with partial or full bookings.

---

## Features Implemented

### ✅ 1. Trip Visibility
- Trips remain visible to all riders until:
  - All seats are filled (status: 'full')
  - Driver manually closes the trip
  - Trip is started
- Real-time updates when seat availability changes

### ✅ 2. Partial Booking Support
- Riders can book individual seats (1-6 seats per booking)
- Multiple riders can book different seats on the same trip
- Trip remains active even with partial bookings
- Example: Driver posts 4 seats → Rider A books 1 → Trip still shows 3 available seats

### ✅ 3. Dynamic Seat Tracking
- **Total Seats**: Number of seats driver posted
- **Booked Seats**: Number of seats currently booked
- **Available Seats**: Remaining seats (Total - Booked)
- Real-time updates via Socket.io

### ✅ 4. Driver Decision Control
- **Start with Partial Bookings**: Driver can start trip even if not all seats filled
- **Wait for Full Capacity**: Driver can wait until all seats are booked
- **Manual Close**: Driver can close trip without starting
- **Auto-Start Option**: Automatically start when all seats filled (optional)
- **Decision Deadline**: Optional deadline for driver to make decision

### ✅ 5. Trip Status Management
- **open**: Trip just posted, no bookings yet
- **partially_filled**: Some seats booked, some available
- **full**: All seats booked
- **started**: Driver started the trip
- **in_progress**: Trip is ongoing
- **completed**: Trip finished
- **cancelled**: Trip cancelled
- **closed**: Driver closed without starting

### ✅ 6. Real-Time Updates
- Riders see live seat availability
- Notifications when:
  - Seat is booked
  - Trip becomes full
  - Trip is started
  - Trip is closed
  - Booking is cancelled

---

## Database Schema Changes

### Trip Model Updates

```javascript
{
  // Existing fields...
  seats: Number,              // Total seats available
  availableSeats: Number,     // Remaining seats
  bookedSeats: Number,        // Currently booked seats
  
  status: {
    type: String,
    enum: ['open', 'partially_filled', 'full', 'started', 
           'in_progress', 'completed', 'cancelled', 'closed']
  },
  
  bookings: [{
    rider: ObjectId,          // Rider who booked
    seatsBooked: Number,      // Number of seats booked
    status: String,           // 'pending', 'confirmed', 'cancelled'
    bookedAt: Date
  }],
  
  driverDecision: {
    canStartPartial: Boolean,      // Can start with partial bookings?
    autoStartWhenFull: Boolean,    // Auto-start when full?
    decisionDeadline: Date         // Optional deadline
  },
  
  closedManually: Boolean,    // Did driver close manually?
  closedAt: Date
}
```

### Match Model Updates

```javascript
{
  // Existing fields...
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'accepted', 'rejected', 'expired', 'cancelled']
  },
  seatsRequested: Number      // Number of seats requested
}
```

---

## API Endpoints

### 1. Book Seats
```
POST /api/trips/:tripId/book
Body: { seatsRequested: 1-6 }

Response: {
  success: true,
  message: "2 seat(s) booked successfully!",
  trip: { ... },
  booking: { ... }
}
```

**Validations:**
- Trip must be 'open' or 'partially_filled'
- Enough seats must be available
- User cannot book own trip
- User cannot have duplicate booking

### 2. Cancel Booking
```
POST /api/trips/:tripId/cancel-booking

Response: {
  success: true,
  message: "Booking cancelled successfully",
  trip: { ... }
}
```

**Validations:**
- User must have an active booking
- Cannot cancel after trip started

### 3. Start Trip (Driver)
```
POST /api/trips/:tripId/start

Response: {
  success: true,
  message: "Trip started successfully!",
  trip: { ... }
}
```

**Validations:**
- Only trip owner can start
- Must have at least one confirmed booking
- If partial bookings, driver must allow partial start

### 4. Close Trip (Driver)
```
POST /api/trips/:tripId/close

Response: {
  success: true,
  message: "Trip closed successfully",
  trip: { ... }
}
```

**Validations:**
- Only trip owner can close
- Cannot close if already started/completed

### 5. Update Driver Settings
```
PUT /api/trips/:tripId/driver-settings
Body: {
  canStartPartial: true,
  autoStartWhenFull: false,
  decisionDeadline: "2024-04-10T10:00:00Z"
}

Response: {
  success: true,
  message: "Driver settings updated",
  driverDecision: { ... }
}
```

### 6. Get Trip Bookings (Driver Only)
```
GET /api/trips/:tripId/bookings

Response: {
  success: true,
  trip: { ... },
  bookings: {
    confirmed: [...],
    cancelled: [...],
    total: 5
  },
  driverDecision: { ... }
}
```

---

## Real-Time Socket Events

### Events Emitted by Server

#### 1. seat_booked
```javascript
{
  trip: tripId,
  rider: { _id, name, profilePhoto },
  seatsBooked: 2,
  remainingSeats: 3,
  status: 'partially_filled'
}
```
**Sent to**: Trip owner (driver)

#### 2. trip_full
```javascript
{
  tripId: tripId
}
```
**Sent to**: All connected clients (broadcast)

#### 3. trip_started
```javascript
{
  trip: tripId,
  message: 'Your trip has started!',
  driver: { _id, name }
}
```
**Sent to**: All riders with confirmed bookings

#### 4. trip_closed
```javascript
{
  trip: tripId,
  message: 'The trip has been closed by the driver'
}
```
**Sent to**: All riders with confirmed bookings

#### 5. trip_unavailable
```javascript
{
  tripId: tripId
}
```
**Sent to**: All connected clients (broadcast)

#### 6. booking_cancelled
```javascript
{
  trip: tripId,
  rider: { _id, name },
  seatsFreed: 1,
  remainingSeats: 4,
  status: 'partially_filled'
}
```
**Sent to**: Trip owner (driver)

---

## Client-Side Integration

### Booking Flow (Rider)

```javascript
import { tripsAPI } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';

// Book seats
const handleBookSeats = async (tripId, seatsRequested) => {
  try {
    const res = await tripsAPI.bookSeats(tripId, seatsRequested);
    toast.success(res.data.message);
    // Update UI with new trip data
    setTrip(res.data.trip);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Booking failed');
  }
};

// Cancel booking
const handleCancelBooking = async (tripId) => {
  try {
    const res = await tripsAPI.cancelBooking(tripId);
    toast.success(res.data.message);
    setTrip(res.data.trip);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Cancellation failed');
  }
};

// Listen for real-time updates
const { socket } = useSocket();

useEffect(() => {
  if (!socket) return;
  
  socket.on('trip_full', ({ tripId }) => {
    // Remove trip from available list
    setTrips(prev => prev.filter(t => t._id !== tripId));
  });
  
  socket.on('trip_started', ({ trip, message }) => {
    toast.success(message);
    // Navigate to trip tracking
  });
  
  socket.on('trip_closed', ({ trip, message }) => {
    toast.info(message);
  });
  
  return () => {
    socket.off('trip_full');
    socket.off('trip_started');
    socket.off('trip_closed');
  };
}, [socket]);
```

### Driver Control Flow

```javascript
// Get trip bookings
const fetchBookings = async (tripId) => {
  try {
    const res = await tripsAPI.getBookings(tripId);
    setBookings(res.data.bookings);
    setDriverSettings(res.data.driverDecision);
  } catch (error) {
    console.error(error);
  }
};

// Update driver settings
const updateSettings = async (tripId, settings) => {
  try {
    const res = await tripsAPI.updateDriverSettings(tripId, settings);
    toast.success('Settings updated');
    setDriverSettings(res.data.driverDecision);
  } catch (error) {
    toast.error('Failed to update settings');
  }
};

// Start trip
const handleStartTrip = async (tripId) => {
  try {
    const res = await tripsAPI.startTrip(tripId);
    toast.success(res.data.message);
    router.push(`/driver/trip/${tripId}/tracking`);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to start trip');
  }
};

// Close trip
const handleCloseTrip = async (tripId) => {
  try {
    const res = await tripsAPI.closeTrip(tripId);
    toast.success(res.data.message);
    router.push('/driver/dashboard');
  } catch (error) {
    toast.error('Failed to close trip');
  }
};

// Listen for bookings
useEffect(() => {
  if (!socket) return;
  
  socket.on('seat_booked', ({ rider, seatsBooked, remainingSeats, status }) => {
    toast.success(`${rider.name} booked ${seatsBooked} seat(s)!`);
    fetchBookings(tripId); // Refresh bookings
  });
  
  socket.on('booking_cancelled', ({ rider, seatsFreed }) => {
    toast.info(`${rider.name} cancelled their booking`);
    fetchBookings(tripId);
  });
  
  return () => {
    socket.off('seat_booked');
    socket.off('booking_cancelled');
  };
}, [socket, tripId]);
```

---

## Usage Examples

### Example 1: Driver Posts Trip with 4 Seats

```javascript
// Driver creates trip
const tripData = {
  source: { address: 'Location A', lat: 18.5, lng: 73.8 },
  destination: { address: 'Location B', lat: 18.6, lng: 73.9 },
  date: '2024-04-10',
  time: '09:00',
  seats: 4,  // 4 seats available
  vehicleType: 'car',
  estimatedFare: 200
};

const trip = await tripsAPI.create(tripData);
// Trip status: 'open'
// Available seats: 4
// Booked seats: 0
```

### Example 2: Partial Bookings

```javascript
// Rider 1 books 1 seat
await tripsAPI.bookSeats(tripId, 1);
// Status: 'partially_filled'
// Available: 3, Booked: 1

// Rider 2 books 2 seats
await tripsAPI.bookSeats(tripId, 2);
// Status: 'partially_filled'
// Available: 1, Booked: 3

// Rider 3 books 1 seat
await tripsAPI.bookSeats(tripId, 1);
// Status: 'full'
// Available: 0, Booked: 4
```

### Example 3: Driver Starts with Partial Bookings

```javascript
// Only 2 out of 4 seats booked
// Driver decides to start anyway

// First, enable partial start
await tripsAPI.updateDriverSettings(tripId, {
  canStartPartial: true
});

// Then start the trip
await tripsAPI.startTrip(tripId);
// Status: 'started'
// Trip no longer visible to other riders
```

### Example 4: Auto-Start When Full

```javascript
// Driver enables auto-start
await tripsAPI.updateDriverSettings(tripId, {
  autoStartWhenFull: true
});

// When 4th seat is booked, trip automatically starts
// No manual intervention needed
```

---

## Search Query Updates

### Updated Search Logic

```javascript
// Only show trips that are open for booking
const query = {
  status: { $in: ['open', 'partially_filled'] },
  availableSeats: { $gte: 1 },
  closedManually: false
};
```

Trips are hidden when:
- Status is 'full', 'started', 'in_progress', 'completed', 'cancelled', or 'closed'
- Available seats = 0
- Driver closed manually

---

## Testing Checklist

### Booking Flow
- [ ] Rider can book 1 seat on a trip
- [ ] Rider can book multiple seats (2-6)
- [ ] Cannot book more seats than available
- [ ] Cannot book own trip
- [ ] Cannot have duplicate booking
- [ ] Seat counts update correctly
- [ ] Trip status updates (open → partially_filled → full)

### Cancellation Flow
- [ ] Rider can cancel their booking
- [ ] Seats are restored correctly
- [ ] Status updates (full → partially_filled → open)
- [ ] Cannot cancel after trip started
- [ ] Driver receives cancellation notification

### Driver Control
- [ ] Driver can view all bookings
- [ ] Driver can start trip with partial bookings (if enabled)
- [ ] Driver cannot start without bookings
- [ ] Driver can close trip manually
- [ ] Driver can update settings
- [ ] Auto-start works when enabled

### Real-Time Updates
- [ ] Driver receives notification when seat booked
- [ ] Riders receive notification when trip starts
- [ ] Riders receive notification when trip closed
- [ ] Trip disappears from search when full/started/closed
- [ ] Seat availability updates in real-time

### Edge Cases
- [ ] Multiple riders booking simultaneously
- [ ] Booking exactly the last available seat
- [ ] Cancelling when trip is full (should reopen)
- [ ] Starting trip immediately after booking
- [ ] Decision deadline expiration (if implemented)

---

## Migration Script

Run this to update existing trips:

```javascript
// server/scripts/migrateToFlexibleBooking.js
const Trip = require('../models/Trip');

const migrate = async () => {
  const trips = await Trip.find({});
  
  for (const trip of trips) {
    if (!trip.bookedSeats) trip.bookedSeats = 0;
    if (!trip.bookings) trip.bookings = [];
    if (!trip.driverDecision) {
      trip.driverDecision = {
        canStartPartial: true,
        autoStartWhenFull: false
      };
    }
    if (!trip.closedManually) trip.closedManually = false;
    
    // Update status based on old status
    if (trip.status === 'active') {
      trip.status = trip.bookedSeats === 0 ? 'open' : 
                    trip.bookedSeats < trip.seats ? 'partially_filled' : 'full';
    }
    
    await trip.save();
  }
  
  console.log(`Migrated ${trips.length} trips`);
};
```

---

## Summary

The flexible booking system is now fully implemented with:

✅ **Dynamic seat management** - Real-time tracking of available/booked seats
✅ **Partial booking support** - Multiple riders can book individual seats
✅ **Driver decision control** - Full control over when to start
✅ **Real-time notifications** - Socket.io events for all state changes
✅ **Flexible status management** - 8 different trip statuses
✅ **Auto-start option** - Optional automatic trip start when full
✅ **Manual close** - Driver can close without starting
✅ **Booking cancellation** - Riders can cancel with seat restoration

The system provides maximum flexibility while maintaining data integrity and real-time synchronization across all clients.
