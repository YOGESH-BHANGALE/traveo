# Traveo - Travel Together, Save Together

A production-ready, full-stack ride-sharing and travel matching platform that connects people traveling to the same destination at similar times.

## Features

- **Smart Travel Matching** - Algorithm-based matching using destination similarity, distance (< 1km), and time proximity (< 30 min)
- **Real-time Chat** - Socket.io powered messaging with typing indicators
- **Live Location Tracking** - Google Maps integration with route visualization
- **Cost Splitting** - Dynamic fare calculation and automatic cost splitting
- **Safety Features** - User verification, ratings, reports, emergency contacts
- **Google OAuth** - Secure authentication with JWT and Google login
- **Responsive UI** - Beautiful, mobile-first design with Framer Motion animations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Real-time | Socket.io |
| Maps | Google Maps API, Places API, Distance Matrix API |
| Auth | JWT, Google OAuth 2.0 |
| Payments | UPI / Stripe simulation |

## Project Structure

```
traveo/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # API client & utilities
│   │   └── styles/        # Global styles
│   └── package.json
├── server/                 # Express.js backend
│   ├── config/            # Database & passport config
│   ├── controllers/       # Route controllers
│   ├── middleware/         # Auth middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   ├── socket/            # Socket.io handlers
│   └── package.json
└── README.md
```

## Getting Started

### Quick Start

For detailed installation instructions, see [INSTALLATION.md](./INSTALLATION.md)

For production deployment guide, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Google Cloud Console project (for Maps & OAuth)

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd traveo
```

2. **Install dependencies**
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

3. **Configure environment variables**

Create `server/.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/traveo
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
CLIENT_URL=http://localhost:3000
```

Create `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

4. **Start the development servers**

Backend:
```bash
cd server
npm run dev
```

Frontend (in a new terminal):
```bash
cd client
npm run dev
```

The app will be available at `http://localhost:3000`

### Detailed Guides

- **Installation**: See [INSTALLATION.md](./INSTALLATION.md) for step-by-step setup
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- **API Documentation**: See API Routes section below

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/google` | Google OAuth login |
| POST | `/api/trips` | Create a trip |
| GET | `/api/trips/search` | Search available trips |
| GET | `/api/trips/:tripId/matches` | Get matches for a trip |
| POST | `/api/rides/accept` | Accept a ride match |
| POST | `/api/rides/reject` | Reject a ride match |
| GET | `/api/rides/my` | Get user's rides |
| POST | `/api/messages` | Send a message |
| GET | `/api/messages/:rideId` | Get ride messages |

## Deployment

### Frontend → Vercel
```bash
cd client
npm run build
# Deploy via Vercel CLI or GitHub integration
```

### Backend → Render
```bash
# Deploy server/ directory to Render
# Set environment variables in Render dashboard
```

### Database → MongoDB Atlas
- Create a free cluster at [mongodb.com](https://www.mongodb.com/atlas)
- Whitelist your server IP
- Use the connection string in `MONGODB_URI`

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 10 minutes
- **[INSTALLATION.md](./INSTALLATION.md)** - Detailed installation guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Complete feature list and architecture

## Support

For issues or questions:
- Check the troubleshooting sections in documentation
- Review error messages in terminal/console
- Create a GitHub issue with details

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT



node server/scripts/cleanDatabase.js
