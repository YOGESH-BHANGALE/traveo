# Traveo - Render Deployment Guide 🚀

## Overview
This guide will help you deploy Traveo (both frontend and backend) on Render.

## Prerequisites
- ✅ GitHub account
- ✅ Render account (free tier available)
- ✅ MongoDB Atlas account (for database)
- ✅ Google Cloud Console (for Maps & OAuth)
- ✅ Razorpay account (for payments)

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Render Platform                 │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Frontend (Next.js)              │  │
│  │  traveo-frontend.onrender.com    │  │
│  │  Port: 3000                      │  │
│  └──────────────────────────────────┘  │
│              ↓ API Calls                │
│  ┌──────────────────────────────────┐  │
│  │  Backend (Node.js/Express)       │  │
│  │  traveo-backend.onrender.com     │  │
│  │  Port: 5000                      │  │
│  └──────────────────────────────────┘  │
│              ↓                          │
└─────────────────────────────────────────┘
              ↓
    ┌──────────────────┐
    │  MongoDB Atlas   │
    │  (Database)      │
    └──────────────────┘
```

## Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 1.2 Verify Files
Ensure these files exist:
- ✅ `render.yaml` (deployment config)
- ✅ `server/package.json`
- ✅ `client/package.json`
- ✅ `server/.env.example`
- ✅ `client/.env.example`

## Step 2: Set Up MongoDB Atlas

### 2.1 Create Database
1. Go to https://cloud.mongodb.com
2. Create a new cluster (free tier)
3. Create database user
4. Whitelist all IPs: `0.0.0.0/0`
5. Get connection string

### 2.2 Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/traveo?retryWrites=true&w=majority
```

## Step 3: Deploy Backend on Render

### 3.1 Create New Web Service
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `traveo-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free

### 3.2 Add Environment Variables
Click "Environment" and add:

```bash
# Required
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# AI Chatbot (Optional)
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key

# Push Notifications (Optional)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your_email@example.com
```

### 3.3 Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Note your backend URL: `https://traveo-backend.onrender.com`

## Step 4: Deploy Frontend on Render

### 4.1 Create New Web Service
1. Click "New +" → "Web Service"
2. Connect same GitHub repository
3. Configure:
   - **Name**: `traveo-frontend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Environment**: `Node`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Start Command**: `cd client && npm start`
   - **Plan**: Free

### 4.2 Add Environment Variables
```bash
# Required
NODE_ENV=production

# Backend API URL (use your backend URL from Step 3.3)
NEXT_PUBLIC_API_URL=https://traveo-backend.onrender.com

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Google OAuth (same as backend)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Razorpay (public key only)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 4.3 Deploy
1. Click "Create Web Service"
2. Wait for deployment (10-15 minutes)
3. Your app will be live at: `https://traveo-frontend.onrender.com`

## Step 5: Configure Google OAuth

### 5.1 Update Authorized Origins
1. Go to Google Cloud Console
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add Authorized JavaScript origins:
   ```
   https://traveo-frontend.onrender.com
   ```
5. Add Authorized redirect URIs:
   ```
   https://traveo-frontend.onrender.com/auth/callback
   ```

## Step 6: Configure CORS (Backend)

Update `server/server.js` CORS configuration:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://traveo-frontend.onrender.com', // Add your frontend URL
  ],
  credentials: true,
};
```

## Step 7: Test Your Deployment

### 7.1 Backend Health Check
Visit: `https://traveo-backend.onrender.com/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-04-06T..."
}
```

### 7.2 Frontend Check
Visit: `https://traveo-frontend.onrender.com`

Should see Traveo homepage.

### 7.3 Test Features
1. ✅ Register new account
2. ✅ Login
3. ✅ Post a trip
4. ✅ Search trips
5. ✅ Real-time chat
6. ✅ Notifications

## Important Notes

### Free Tier Limitations
- ⚠️ Services spin down after 15 minutes of inactivity
- ⚠️ First request after spin-down takes 30-60 seconds
- ⚠️ 750 hours/month free (enough for 1 service 24/7)

### Solutions:
1. **Use Cron Job**: Ping your services every 14 minutes
2. **Upgrade to Paid**: $7/month per service (no spin-down)
3. **Use UptimeRobot**: Free service to keep apps awake

### WebSocket Considerations
- Render supports WebSocket connections
- Ensure Socket.io is configured for production
- Use sticky sessions if scaling

## Troubleshooting

### Issue: Build Fails
**Solution**: Check build logs in Render dashboard
```bash
# Common fixes:
- Ensure package.json has all dependencies
- Check Node version compatibility
- Verify build commands are correct
```

### Issue: Environment Variables Not Working
**Solution**: 
1. Double-check variable names (case-sensitive)
2. Restart service after adding variables
3. Check logs for missing variables

### Issue: MongoDB Connection Fails
**Solution**:
1. Verify connection string format
2. Check MongoDB Atlas IP whitelist (use 0.0.0.0/0)
3. Ensure database user has correct permissions

### Issue: CORS Errors
**Solution**:
1. Add frontend URL to CORS origins in backend
2. Ensure credentials: true in CORS config
3. Check browser console for specific error

### Issue: 502 Bad Gateway
**Solution**:
1. Check if backend is running
2. Verify NEXT_PUBLIC_API_URL is correct
3. Check backend logs for errors

## Monitoring & Logs

### View Logs
1. Go to Render Dashboard
2. Select your service
3. Click "Logs" tab
4. Monitor real-time logs

### Set Up Alerts
1. Go to service settings
2. Add notification email
3. Configure alert thresholds

## Custom Domain (Optional)

### Add Custom Domain
1. Go to service settings
2. Click "Custom Domains"
3. Add your domain (e.g., traveo.com)
4. Update DNS records as instructed
5. SSL certificate auto-generated

## Continuous Deployment

### Auto-Deploy on Push
Render automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Render will auto-deploy
```

### Manual Deploy
1. Go to Render Dashboard
2. Select service
3. Click "Manual Deploy" → "Deploy latest commit"

## Performance Optimization

### 1. Enable Caching
```javascript
// In next.config.js
module.exports = {
  compress: true,
  poweredByHeader: false,
};
```

### 2. Optimize Images
- Use Next.js Image component
- Enable image optimization

### 3. Database Indexing
- Add indexes to frequently queried fields
- Use MongoDB Atlas performance advisor

## Security Checklist

- ✅ All secrets in environment variables
- ✅ JWT_SECRET is strong (32+ characters)
- ✅ MongoDB IP whitelist configured
- ✅ CORS properly configured
- ✅ HTTPS enabled (automatic on Render)
- ✅ Rate limiting enabled
- ✅ Input validation on all endpoints

## Cost Estimate

### Free Tier (Current Setup)
- Backend: Free (with spin-down)
- Frontend: Free (with spin-down)
- MongoDB Atlas: Free (512MB)
- **Total**: $0/month

### Paid Tier (Recommended for Production)
- Backend: $7/month (no spin-down)
- Frontend: $7/month (no spin-down)
- MongoDB Atlas: $9/month (2GB)
- **Total**: $23/month

## Support & Resources

- Render Docs: https://render.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Next.js Deployment: https://nextjs.org/docs/deployment
- Traveo GitHub: Your repository URL

## Deployment Checklist

Before going live:
- [ ] All environment variables set
- [ ] MongoDB connection working
- [ ] Google OAuth configured
- [ ] CORS configured correctly
- [ ] Health check endpoint working
- [ ] Frontend loads successfully
- [ ] User registration works
- [ ] Login/logout works
- [ ] Trip posting works
- [ ] Real-time features work
- [ ] Payment integration tested
- [ ] Mobile responsive
- [ ] Error handling tested

## Next Steps

1. ✅ Deploy backend
2. ✅ Deploy frontend
3. ✅ Test all features
4. ✅ Set up monitoring
5. ✅ Configure custom domain (optional)
6. ✅ Set up uptime monitoring
7. ✅ Share with users!

---

**Your Deployed URLs:**
- Frontend: `https://traveo-frontend.onrender.com`
- Backend: `https://traveo-backend.onrender.com`

**Status**: Ready for deployment! 🚀
