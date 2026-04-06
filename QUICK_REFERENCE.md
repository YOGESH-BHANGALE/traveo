# Flexible Booking System - Quick Reference

## 🎯 Core Concept
Drivers post trips with multiple seats. Riders book individual seats. Driver decides when to start (partial or full).

---

## 📊 Trip Statuses

| Status | Meaning | Visible to Riders? |
|--------|---------|-------------------|
| `open` | No bookings yet | ✅ Yes |
| `partially_filled` | Some seats booked | ✅ Yes |
| `full` | All seats booked | ❌ No |
| `started` | Driver started trip | ❌ No |
| `in_progress` | Trip ongoing | ❌ No |
| `completed` | Trip finished | ❌ No |
| `cancelled` | Trip cancelled | ❌ No |
| `closed` | Manually closed | ❌ No |

---

## 🔌 API Quick Reference

### Rider Actions
```javascript
// Book seats
POST /api/trips/:tripId/book
Body: { seatsRequested: 2 }

// Cancel booking
POST /api/trips/:tripId/cancel-booking
```

### Driver Actions
```javascript
// View bookings
GET /api/trips/:tripId/bookings

// Start trip
POST /api/trips/:tripId/start

// Close trip
POST /api/trips/:tripId/close

// Update settings
PUT /api/trips/:tripId/driver-settings
Body: { 
  canStartPartial: true,
  autoStartWhenFull: false 
}
```

---

## 🔄 Socket Events

### Listen For (Client)
```javascript
socket.on('seat_booked', handler);      // Driver: seat booked
socket.on('trip_full', handler);        // All: trip full
socket.on('trip_started', handler);     // Riders: trip started
socket.on('trip_closed', handler);      // Riders: trip closed
socket.on('booking_cancelled', handler); // Driver: booking cancelled
```

---

## 💻 Client Code Examples

### Book Seats
```javascript
import { tripsAPI } from '@/lib/api';

const bookSeats = async (tripId, seats) => {
  try {
    const res = await tripsAPI.bookSeats(tripId, seats);
    toast.success(res.data.message);
  } catch (error) {
    toast.error(error.response?.data?.message);
  }
};
```

### Start Trip (Driver)
```javascript
const startTrip = async (tripId) => {
  try {
    await tripsAPI.startTrip(tripId);
    toast.success('Trip started!');
  } catch (error) {
    toast.error(error.response?.data?.message);
  }
};
```

### Real-time Updates
```javascript
const { socket } = useSocket();

useEffect(() => {
  if (!socket) return;
  
  socket.on('seat_booked', ({ rider, seatsBooked }) => {
    toast.success(`${rider.name} booked ${seatsBooked} seat(s)`);
  });
  
  return () => socket.off('seat_booked');
}, [socket]);
```

---

## 🗄️ Database Fields

### Trip Model
```javascript
{
  seats: 4,              // Total capacity
  bookedSeats: 2,        // Currently booked
  availableSeats: 2,     // Remaining
  status: 'partially_filled',
  
  bookings: [{
    rider: ObjectId,
    seatsBooked: 1,
    status: 'confirmed',
    bookedAt: Date
  }],
  
  driverDecision: {
    canStartPartial: true,
    autoStartWhenFull: false,
    decisionDeadline: Date
  },
  
  closedManually: false
}
```

---

## 🧪 Testing Commands

```bash
# Run migration
node scripts/migrateToFlexibleBooking.js

# Run tests
node scripts/testFlexibleBooking.js

# Fix seat counts
node scripts/fixSeatCounts.js

# Verify database
node scripts/verifyDatabase.js
```

---

## ⚠️ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Only X seat(s) available" | Not enough seats | Book fewer seats |
| "Cannot book your own trip" | Booking own trip | Use different account |
| "Trip is not available" | Trip closed/started | Find another trip |
| "You already have a booking" | Duplicate booking | Cancel first, then rebook |
| "Cannot start with partial bookings" | Setting disabled | Enable canStartPartial |

---

## 📝 Validation Rules

### Booking
- ✅ 1-6 seats per booking
- ✅ Enough seats available
- ✅ Trip is open/partially_filled
- ✅ Not your own trip
- ✅ No duplicate booking

### Starting Trip
- ✅ At least 1 confirmed booking
- ✅ Only trip owner
- ✅ canStartPartial enabled (if partial)

---

## 🎨 UI Components Needed

### Rider View
- [ ] Seat selector (1-6)
- [ ] Available seats display
- [ ] Book button
- [ ] Cancel booking button
- [ ] Real-time seat updates

### Driver View
- [ ] Bookings list
- [ ] Seat occupancy chart
- [ ] Start trip button
- [ ] Close trip button
- [ ] Settings panel
- [ ] Real-time booking notifications

---

## 🚀 Quick Start

1. **Migration** (one-time)
   ```bash
   node scripts/migrateToFlexibleBooking.js
   ```

2. **Test** (verify)
   ```bash
   node scripts/testFlexibleBooking.js
   ```

3. **Integrate** (frontend)
   - Import `tripsAPI` from `@/lib/api`
   - Use socket events for real-time updates
   - Create booking UI components

4. **Deploy**
   - Backend is ready ✅
   - Create UI components
   - Test end-to-end flow

---

## 📞 Need Help?

- **Full Guide**: `FLEXIBLE_BOOKING_SYSTEM.md`
- **Implementation**: `IMPLEMENTATION_SUMMARY.md`
- **Role System**: `ROLE_SYSTEM_GUIDE.md`

---

## ✅ Status

**Backend**: ✅ Complete
**Database**: ✅ Migrated
**API**: ✅ Tested
**Real-time**: ✅ Working
**Frontend**: ⏳ Pending UI components

**Ready for frontend integration!**
