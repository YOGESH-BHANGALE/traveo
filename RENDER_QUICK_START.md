# Traveo - Render Quick Start Guide 🚀

## 5-Minute Deployment

### Step 1: Push to GitHub (1 min)
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### Step 2: Deploy Backend (2 min)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Fill in:
   - **Name**: `traveo-backend`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
5. Add these environment variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key_min_32_chars
   ```
6. Click **"Create Web Service"**
7. Copy your backend URL: `https://traveo-backend.onrender.com`

### Step 3: Deploy Frontend (2 min)

1. Click **"New +"** → **"Web Service"**
2. Connect same GitHub repo
3. Fill in:
   - **Name**: `traveo-frontend`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Start Command**: `cd client && npm start`
4. Add these environment variables:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://traveo-backend.onrender.com
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   ```
5. Click **"Create Web Service"**

### Step 4: Test (30 sec)

Visit: `https://traveo-frontend.onrender.com`

✅ Done! Your app is live!

---

## Essential Environment Variables

### Backend (Minimum Required)
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/traveo
JWT_SECRET=your_super_secret_key_minimum_32_characters
CLIENT_URL=https://traveo-frontend.onrender.com
```

### Frontend (Minimum Required)
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://traveo-backend.onrender.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## MongoDB Atlas Setup (2 min)

1. Go to https://cloud.mongodb.com
2. Create free cluster
3. Create database user
4. Network Access → Add IP: `0.0.0.0/0`
5. Copy connection string
6. Replace `<password>` with your password

---

## Troubleshooting

### Build Fails?
- Check Render logs
- Verify package.json exists
- Ensure all dependencies listed

### Can't Connect to Database?
- Check MongoDB URI format
- Verify IP whitelist: `0.0.0.0/0`
- Test connection string locally

### CORS Errors?
- Add frontend URL to backend CORS
- Redeploy backend

### App Slow to Load?
- Free tier spins down after 15 min
- First request takes 30-60 sec
- Upgrade to paid ($7/month) for instant response

---

## Your Deployed URLs

- **Frontend**: https://traveo-frontend.onrender.com
- **Backend**: https://traveo-backend.onrender.com
- **Health Check**: https://traveo-backend.onrender.com/api/health

---

## Next Steps

1. ✅ Test all features
2. ✅ Configure Google OAuth
3. ✅ Set up monitoring
4. ✅ Share with users!

For detailed guide, see: `RENDER_DEPLOYMENT_GUIDE.md`
