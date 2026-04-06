# Unified Localhost Setup - Single URL Access ✅

## Overview
Both frontend and backend are now accessible through a single URL using Next.js proxy configuration.

## 🌐 Single Access Point

### Main URL: http://localhost:3000

This single URL now handles:
- ✅ Frontend application (React/Next.js)
- ✅ Backend API (proxied to port 5000)
- ✅ WebSocket connections (Socket.io)

## How It Works

### Proxy Configuration
Next.js automatically forwards requests:
- `/api/*` → `http://localhost:5000/api/*`
- `/socket.io/*` → `http://localhost:5000/socket.io/*`

### Benefits
1. **Single URL**: Only need to remember `http://localhost:3000`
2. **No CORS Issues**: Same-origin requests
3. **Simplified Development**: No need to manage multiple URLs
4. **Production-Ready**: Same pattern works in production

## Files Modified

### 1. `client/next.config.js`
Added rewrites configuration:
```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:5000/api/:path*',
    },
    {
      source: '/socket.io/:path*',
      destination: 'http://localhost:5000/socket.io/:path*',
    },
  ];
}
```

### 2. Environment Variables
Updated `.env`, `.env.local`, `.env.example`:
```bash
# Empty = use same origin with proxy
NEXT_PUBLIC_API_URL=
```

### 3. `client/src/lib/api.js`
Updated to use relative URLs:
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  // ...
});
```

### 4. `client/src/lib/socket.js`
Updated to use same origin:
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
```

### 5. `client/src/components/Chatbot.js`
Updated fetch URL:
```javascript
const response = await fetch('/api/chatbot/chat', {
  // ...
});
```

## Server Requirements

### Both servers must be running:

1. **Backend Server** (Port 5000)
   ```bash
   cd server
   npm start
   ```

2. **Frontend Server** (Port 3000)
   ```bash
   cd client
   npm run dev
   ```

## Access Points

### 🎯 Main Application
**URL**: http://localhost:3000

### 📡 API Endpoints (via proxy)
- Auth: http://localhost:3000/api/auth/*
- Trips: http://localhost:3000/api/trips/*
- Rides: http://localhost:3000/api/rides/*
- Messages: http://localhost:3000/api/messages/*
- Users: http://localhost:3000/api/users/*
- Chatbot: http://localhost:3000/api/chatbot/*

### 🔌 WebSocket (via proxy)
- Socket.io: http://localhost:3000/socket.io/

## Testing the Setup

1. Open browser: http://localhost:3000
2. Open DevTools → Network tab
3. Login or navigate around
4. Check API calls - they should go to `/api/*` (not `http://localhost:5000`)
5. Check WebSocket - should connect to same origin

## Troubleshooting

### Issue: API calls fail
**Solution**: Ensure backend server is running on port 5000
```bash
cd server
npm start
```

### Issue: WebSocket not connecting
**Solution**: 
1. Check backend server is running
2. Clear browser cache
3. Restart frontend server

### Issue: Changes not reflecting
**Solution**: Restart frontend server
```bash
# Stop with Ctrl+C
cd client
npm run dev
```

## Production Deployment

For production, update environment variables:
```bash
# Production .env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

The proxy will be bypassed in production, and requests will go directly to the production API URL.

## Summary

✅ Single URL: http://localhost:3000
✅ No CORS issues
✅ Simplified development
✅ Production-ready configuration
✅ Both frontend and backend accessible

Just open http://localhost:3000 and everything works!
