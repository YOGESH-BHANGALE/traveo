const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
dotenv.config();
const connectDB = require('./config/db');
const passport = require('./config/passport');
const initializeSocket = require('./socket/chatHandler');
const { configurePush } = require('./services/notificationService');

// Load environment variables

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Configure push notifications
configurePush();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));

// CORS configuration for production and development
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(allowed => origin?.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Make io accessible to routes BEFORE loading routes
app.set('io', io);

// API Routes
const authLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased from 20 to 50
  message: { success: false, message: 'Too many attempts, please try again later.' },
  skip: (req) => {
    // Skip rate limiting for Google OAuth routes
    return req.path.startsWith('/google');
  }
});
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/auto', require('./routes/auto'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/driver', require('./routes/driver'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Traveo API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Initialize Socket.io handlers
initializeSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║     Traveo Server is Running         ║
  ║     Port: ${PORT}                        ║
  ║     Environment: ${process.env.NODE_ENV || 'development'}       ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
