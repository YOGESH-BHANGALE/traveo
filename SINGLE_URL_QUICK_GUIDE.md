# Single URL Deployment - Quick Guide 🎯

## What You Get

**One URL for everything:**
```
https://traveo-frontend.onrender.com
```

Users access your app through this single URL, and all API requests are automatically proxied to the backend!

---

## How It Works

```
User visits: https://traveo-frontend.onrender.com
                        ↓
            ┌───────────────────────┐
            │   Frontend Service    │
            │   (Next.js)           │
            └───────────────────────┘
                        ↓
        When user makes API call to /api/*
                        ↓
            Next.js automatically proxies to
                        ↓
            ┌───────────────────────┐
            │   Backend Service     │
            │   (Express API)       │
            └───────────────────────┘
```

---

## 3-Step Deployment

### Step 1: Deploy Backend (2 min)

1. Go to https://dashboard.render.com
2. New Web Service → Connect GitHub
3. Settings:
   ```
   Name: traveo-backend
   Build: cd server && npm install
   Start: cd server && npm start
   ```
4. Environment Variables:
   ```bash
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_secret_key
   ```
5. Deploy → Copy URL: `https://traveo-backend.onrender.com`

### Step 2: Deploy Frontend (2 min)

1. New Web Service → Connect GitHub
2. Settings:
   ```
   Name: traveo-frontend
   Build: cd client && npm install && npm run build
   Start: cd client && npm start
   ```
3. Environment Variables:
   ```bash
   NODE_ENV=production
   
   # Backend URL for proxy (internal)
   BACKEND_URL=https://traveo-backend.onrender.com
   
   # Empty = use proxy
   NEXT_PUBLIC_API_URL=
   
   # Your API keys
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
   ```
4. Deploy!

### Step 3: Update Backend CORS (1 min)

1. Go back to backend service
2. Add environment variable:
   ```bash
   CLIENT_URL=https://traveo-frontend.onrender.com
   ```
3. Redeploy backend

---

## ✅ Done!

Your app is live at: **https://traveo-frontend.onrender.com**

All API calls automatically work through the same URL:
- Homepage: `https://traveo-frontend.onrender.com`
- Login API: `https://traveo-frontend.onrender.com/api/auth/login`
- Trips API: `https://traveo-frontend.onrender.com/api/trips`
- WebSocket: `wss://traveo-frontend.onrender.com/socket.io/`

---

## Key Environment Variables

### Backend Service
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/traveo
JWT_SECRET=your_secret_key_min_32_characters
CLIENT_URL=https://traveo-frontend.onrender.com
```

### Frontend Service
```bash
NODE_ENV=production
BACKEND_URL=https://traveo-backend.onrender.com
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## Testing

### 1. Visit Frontend
```
https://traveo-frontend.onrender.com
```
Should load homepage ✅

### 2. Check API Proxy
Open DevTools → Network tab → Login

Request URL should be:
```
https://traveo-frontend.onrender.com/api/auth/login
```
(Not the backend URL!) ✅

### 3. Test Features
- Register/Login ✅
- Post trip ✅
- Real-time chat ✅
- All features work ✅

---

## Why This Works

1. **Next.js Rewrites**: Automatically proxy `/api/*` to backend
2. **Same Origin**: No CORS issues
3. **Single URL**: Users only see frontend URL
4. **Transparent**: Backend is hidden from users

---

## Cost

### Free Tier
- Backend: $0/month
- Frontend: $0/month
- **Total: $0/month**
- (Services spin down after 15 min)

### Paid Tier
- Backend: $7/month
- Frontend: $7/month
- **Total: $14/month**
- (No spin-down, instant response)

---

## Troubleshooting

### API calls return 502
- Check backend is running
- Verify `BACKEND_URL` in frontend env vars

### CORS errors
- Add frontend URL to backend `CLIENT_URL`
- Redeploy backend

### Slow first load
- Normal on free tier (cold start)
- Upgrade to paid or use UptimeRobot

---

## Your Deployment URLs

**Main URL (share this):**
```
https://traveo-frontend.onrender.com
```

**Backend URL (internal only):**
```
https://traveo-backend.onrender.com
```

---

## Summary

✅ **Single URL**: One link for everything
✅ **Easy Setup**: 3 steps, 5 minutes
✅ **No CORS**: Same-origin requests
✅ **Production Ready**: Secure and scalable

Share `https://traveo-frontend.onrender.com` with your users! 🎉

---

For detailed guide, see: `RENDER_SINGLE_URL_DEPLOYMENT.md`
