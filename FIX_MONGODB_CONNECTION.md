# Fix MongoDB Connection Issue

## Problem
Backend server cannot connect to MongoDB Atlas due to IP whitelist restriction.

## Quick Fix (Choose One)

### Option 1: Whitelist Your IP in MongoDB Atlas (5 minutes)

1. **Go to MongoDB Atlas**
   - Visit: https://cloud.mongodb.com
   - Login with your credentials

2. **Navigate to Network Access**
   - Click on your project
   - Click "Network Access" in left sidebar

3. **Add Your IP**
   - Click "Add IP Address" button
   - Click "Add Current IP Address" (recommended)
   - OR click "Allow Access from Anywhere" (0.0.0.0/0) for testing only
   - Click "Confirm"

4. **Wait 1-2 minutes** for changes to propagate

5. **Restart Backend Server**
   ```bash
   cd server
   npm run dev
   ```

### Option 2: Use MongoDB Atlas Connection String with Retry

Your current connection string in `server/.env`:
```
MONGODB_URI=mongodb://bbby8187_db_user:Yoga2909@ac-vxqorxw-shard-00-00.8gvivsu.mongodb.net:27017...
```

This should work once IP is whitelisted.

## Verify Connection

After whitelisting, you should see:
```
✓ MongoDB Connected Successfully
✓ Database: traveo
```

## Current Status

✅ **Frontend**: Running on http://localhost:3000
❌ **Backend**: Crashed due to MongoDB connection
✅ **Environment Variables**: All configured
✅ **Dependencies**: All installed

## Next Steps

1. Fix MongoDB connection (follow Option 1 above)
2. Backend will auto-restart with nodemon
3. Test the application at http://localhost:3000
4. Check all features:
   - Login with Google
   - Create a trip
   - View matches
   - Real-time chat
   - GPS tracking

## Alternative: Use MongoDB Compass to Test Connection

1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Paste your connection string
3. If it connects, the issue is IP whitelist
4. If it doesn't connect, check username/password
