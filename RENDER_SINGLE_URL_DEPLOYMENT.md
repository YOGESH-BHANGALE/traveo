# Deploy Frontend + Backend on Render with Single URL 🚀

## Overview
Deploy both frontend and backend on Render accessible through a single URL using Next.js API rewrites (proxy).

## Architecture

```
Single URL: https://traveo.onrender.com
                    ↓
        ┌───────────────────────┐
        │   Frontend Service    │
        │   (Next.js on 3000)   │
        └───────────────────────┘
                    ↓
        Proxy /api/* requests to
                    ↓
        ┌───────────────────────┐
        │   Backend Service     │
        │   (Express on 5000)   │
        └───────────────────────┘
```

## Method 1: Frontend with API Proxy (Recommended) ⭐

This method uses Next.js rewrites to proxy API requests to the backend.

### Step 1: Deploy Backend (Internal Service)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   ```
   Name: traveo-backend
   Build Command: cd server && npm install
   Start Command: cd server && npm start
   ```

5. Add environment variables:
   ```bash
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key_min_32_chars
   # Add CLIENT_URL after frontend is deployed
   ```

6. Deploy and note the URL: `https://traveo-backend.onrender.com`

### Step 2: Update Next.js Config for Production Proxy

Update `client/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons'],
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  },

  // Proxy API requests to backend
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendUrl}/socket.io/:path*`,
      },
    ];
  },
};

// Production PWA config
if (process.env.NODE_ENV === 'production') {
  try {
    const withPWA = require('next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: false,
    });
    module.exports = withPWA(nextConfig);
  } catch (e) {
    console.warn('next-pwa not available:', e.message);
    module.exports = nextConfig;
  }
} else {
  module.exports = nextConfig;
}
```

### Step 3: Deploy Frontend (Main Service)

1. Click **"New +"** → **"Web Service"**
2. Connect same GitHub repository
3. Configure:
   ```
   Name: traveo-frontend
   Build Command: cd client && npm install && npm run build
   Start Command: cd client && npm start
   ```

4. Add environment variables:
   ```bash
   NODE_ENV=production
   
   # Backend URL for proxy (internal Render URL)
   BACKEND_URL=https://traveo-backend.onrender.com
   
   # Leave empty to use proxy
   NEXT_PUBLIC_API_URL=
   
   # Other variables
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
   ```

5. Deploy!

### Step 4: Update Backend CORS

Go back to backend service and update `CLIENT_URL`:
```bash
CLIENT_URL=https://traveo-frontend.onrender.com
FRONTEND_URL=https://traveo-frontend.onrender.com
```

Redeploy backend.

### Step 5: Test

Visit: **https://traveo-frontend.onrender.com**

All API calls will be proxied through the frontend:
- Frontend: `https://traveo-frontend.onrender.com`
- API: `https://traveo-frontend.onrender.com/api/*` (proxied to backend)
- WebSocket: `https://traveo-frontend.onrender.com/socket.io/*` (proxied)

✅ **Single URL for everything!**

---

## Method 2: Monorepo with Single Service (Alternative)

Deploy both frontend and backend as a single service.

### Step 1: Create Unified Server

Create `server/index.js`:

```javascript
const express = require('express');
const next = require('next');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: path.join(__dirname, '../client') });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

// Import your existing Express app
const apiApp = require('./server'); // Your existing server.js

app.prepare().then(() => {
  const server = express();

  // API routes
  server.use('/api', apiApp);

  // Next.js pages
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
```

### Step 2: Update package.json

Create root `package.json`:

```json
{
  "name": "traveo-monorepo",
  "version": "1.0.0",
  "scripts": {
    "install-all": "cd server && npm install && cd ../client && npm install",
    "build": "cd client && npm run build",
    "start": "cd server && node index.js"
  }
}
```

### Step 3: Deploy on Render

```
Name: traveo
Build Command: npm run install-all && npm run build
Start Command: npm start
```

**Note**: This method is more complex and not recommended for beginners.

---

## Comparison

### Method 1: Frontend with Proxy (Recommended) ⭐

**Pros:**
- ✅ Simple setup
- ✅ Separate services (easier to debug)
- ✅ Can scale independently
- ✅ Works with existing code
- ✅ Single URL for users

**Cons:**
- ⚠️ Two services to manage
- ⚠️ Slightly higher latency (proxy overhead)

**Cost:**
- Free: $0/month (both services spin down)
- Paid: $14/month ($7 × 2 services)

### Method 2: Monorepo (Alternative)

**Pros:**
- ✅ True single service
- ✅ Lower cost ($7/month paid)
- ✅ No proxy overhead

**Cons:**
- ⚠️ Complex setup
- ⚠️ Harder to debug
- ⚠️ Can't scale independently
- ⚠️ Requires code restructuring

**Cost:**
- Free: $0/month
- Paid: $7/month (single service)

---

## Recommended Approach: Method 1

Use **Method 1** (Frontend with Proxy) because:
1. Works with your existing code
2. Easy to set up
3. Easier to maintain
4. Better separation of concerns

## Implementation Steps (Method 1)

### 1. Update next.config.js

```javascript
async rewrites() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  
  return [
    {
      source: '/api/:path*',
      destination: `${backendUrl}/api/:path*`,
    },
    {
      source: '/socket.io/:path*',
      destination: `${backendUrl}/socket.io/:path*`,
    },
  ];
}
```

### 2. Push to GitHub

```bash
git add .
git commit -m "Add production proxy configuration"
git push origin main
```

### 3. Deploy Backend

- Name: `traveo-backend`
- Build: `cd server && npm install`
- Start: `cd server && npm start`
- Env: `NODE_ENV=production`, `PORT=5000`, `MONGODB_URI=...`

### 4. Deploy Frontend

- Name: `traveo-frontend`
- Build: `cd client && npm install && npm run build`
- Start: `cd client && npm start`
- Env: 
  ```
  NODE_ENV=production
  BACKEND_URL=https://traveo-backend.onrender.com
  NEXT_PUBLIC_API_URL=
  ```

### 5. Update Backend CORS

Add frontend URL to backend:
```bash
CLIENT_URL=https://traveo-frontend.onrender.com
```

### 6. Test

Visit: `https://traveo-frontend.onrender.com`

Everything works through one URL! 🎉

---

## Environment Variables Summary

### Backend Service
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
CLIENT_URL=https://traveo-frontend.onrender.com
FRONTEND_URL=https://traveo-frontend.onrender.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

### Frontend Service
```bash
NODE_ENV=production

# Backend URL for internal proxy
BACKEND_URL=https://traveo-backend.onrender.com

# Empty = use proxy (same origin)
NEXT_PUBLIC_API_URL=

# Public keys
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=...
```

---

## Testing Your Deployment

### 1. Check Backend Health
Visit: `https://traveo-backend.onrender.com/api/health`

Should return:
```json
{
  "success": true,
  "message": "Traveo API is running"
}
```

### 2. Check Frontend
Visit: `https://traveo-frontend.onrender.com`

Should load the homepage.

### 3. Check API Proxy
Open browser DevTools → Network tab
Login or make any API call
Check the request URL - should be:
```
https://traveo-frontend.onrender.com/api/auth/login
```
(Not the backend URL!)

### 4. Check WebSocket
Real-time features should work
Socket connection should be to frontend URL

---

## Custom Domain (Optional)

Want your own domain like `traveo.com`?

### 1. Add Custom Domain to Frontend Service

1. Go to frontend service settings
2. Click "Custom Domains"
3. Add: `traveo.com` and `www.traveo.com`
4. Update DNS records as instructed

### 2. Update Environment Variables

Backend:
```bash
CLIENT_URL=https://traveo.com
FRONTEND_URL=https://traveo.com
```

Frontend:
```bash
# No changes needed
```

### 3. Update Google OAuth

Add to authorized origins:
```
https://traveo.com
https://www.traveo.com
```

---

## Troubleshooting

### Issue: API calls fail with 502

**Solution:**
- Check backend is running
- Verify `BACKEND_URL` in frontend env vars
- Check backend logs for errors

### Issue: CORS errors

**Solution:**
- Add frontend URL to backend `CLIENT_URL`
- Redeploy backend
- Clear browser cache

### Issue: WebSocket not connecting

**Solution:**
- Verify Socket.io proxy in next.config.js
- Check backend WebSocket configuration
- Ensure both services are running

### Issue: Slow first load

**Solution:**
- Normal on free tier (spin-down)
- Upgrade to paid tier ($7/month per service)
- Use UptimeRobot to keep services awake

---

## Cost Optimization

### Free Tier Strategy
- Both services free
- Accept 30-60s cold start
- Use UptimeRobot to ping every 14 min

### Paid Tier Strategy
- Frontend: $7/month (user-facing, keep awake)
- Backend: Free (internal, can spin down)
- Total: $7/month

### Full Paid
- Both services: $14/month
- No spin-down
- Instant response
- Best user experience

---

## Final URLs

After deployment:

**Main URL (users visit):**
```
https://traveo-frontend.onrender.com
```

**Backend URL (internal only):**
```
https://traveo-backend.onrender.com
```

**API endpoints (through frontend):**
```
https://traveo-frontend.onrender.com/api/auth/login
https://traveo-frontend.onrender.com/api/trips
https://traveo-frontend.onrender.com/api/rides
```

**WebSocket (through frontend):**
```
wss://traveo-frontend.onrender.com/socket.io/
```

---

## Summary

✅ **Single URL**: https://traveo-frontend.onrender.com
✅ **Frontend + Backend**: Both accessible through one URL
✅ **No CORS issues**: Same-origin requests
✅ **Easy setup**: Works with existing code
✅ **Production ready**: Secure and scalable

Just share the frontend URL with users - they'll never know there are two services! 🎉
