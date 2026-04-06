const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const Ride = require('../models/Ride');

/**
 * Socket.io Chat Handler
 * Manages real-time messaging and location tracking
 */
const initializeSocket = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user._id})`);

    // Join user's personal room for notifications
    socket.join(`user:${socket.user._id}`);

    /**
     * Join a ride chat room
     */
    socket.on('join_ride', async (rideId) => {
      try {
        const ride = await Ride.findById(rideId);
        if (!ride) return;

        const isParticipant = ride.users.some(
          (u) => {
            const uid = u.user?._id?.toString() || u.user?.toString();
            return uid === socket.user._id.toString();
          }
        );

        if (isParticipant) {
          socket.join(`ride:${rideId}`);
          console.log(`${socket.user.name} joined ride room: ${rideId}`);

          // Notify other users in the room
          socket.to(`ride:${rideId}`).emit('user_joined', {
            userId: socket.user._id,
            name: socket.user.name,
          });
        }
      } catch (error) {
        console.error('Join ride error:', error.message);
      }
    });

    /**
     * Leave a ride chat room
     */
    socket.on('leave_ride', (rideId) => {
      socket.leave(`ride:${rideId}`);
      socket.to(`ride:${rideId}`).emit('user_left', {
        userId: socket.user._id,
        name: socket.user.name,
      });
    });

    /**
     * Send a chat message — blocked for completed/cancelled rides
     */
    socket.on('send_message', async (data) => {
      try {
        const { rideId, text } = data;

        // Block messaging if ride is no longer active
        const ride = await Ride.findById(rideId).select('status');
        if (!ride || ['completed', 'cancelled'].includes(ride.status)) {
          socket.emit('message_error', { error: 'Chat is closed for this ride' });
          return;
        }

        const message = await Message.create({
          ride: rideId,
          sender: socket.user._id,
          text,
          readBy: [socket.user._id],
        });

        await message.populate('sender', 'name email profilePhoto');

        // Broadcast to all users in the ride room
        io.to(`ride:${rideId}`).emit('new_message', {
          _id: message._id,
          ride: rideId,
          sender: {
            _id: socket.user._id,
            name: socket.user.name,
            profilePhoto: socket.user.profilePhoto,
          },
          text: message.text,
          createdAt: message.createdAt,
        });
      } catch (error) {
        console.error('Send message error:', error.message);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    /**
     * Typing indicator
     */
    socket.on('typing', (data) => {
      socket.to(`ride:${data.rideId}`).emit('user_typing', {
        userId: socket.user._id,
        name: socket.user.name,
        isTyping: data.isTyping,
      });
    });

    /**
     * Update live location
     */
    socket.on('update_location', (data) => {
      const { rideId, lat, lng, heading } = data;

      // Broadcast location to all users in the ride
      socket.to(`ride:${rideId}`).emit('location_update', {
        userId: socket.user._id,
        name: socket.user.name,
        lat,
        lng,
        heading,
        timestamp: new Date(),
      });
    });

    /**
     * Driver: join auto room and broadcast live location
     */
    socket.on('join_auto', (autoId) => {
      socket.join(`auto:${autoId}`);
    });

    socket.on('leave_auto', (autoId) => {
      socket.leave(`auto:${autoId}`);
    });

    socket.on('driver_location_update', async (data) => {
      const { autoId, lat, lng } = data;
      try {
        const Auto = require('../models/Auto');
        await Auto.findByIdAndUpdate(autoId, {
          'currentLocation.lat': lat,
          'currentLocation.lng': lng,
          'currentLocation.updatedAt': new Date(),
        });
        // Broadcast to all riders watching this auto
        socket.to(`auto:${autoId}`).emit('auto_location_update', {
          autoId,
          lat,
          lng,
          timestamp: new Date(),
        });
      } catch (err) {
        console.error('Driver location update error:', err.message);
      }
    });

    /**
     * SOS — broadcast to emergency contacts
     */
    socket.on('sos', (data) => {
      const { rideId, autoId, lat, lng, message } = data;
      const room = rideId ? `ride:${rideId}` : autoId ? `auto:${autoId}` : null;
      if (room) {
        socket.to(room).emit('sos_alert', {
          from: { _id: socket.user._id, name: socket.user.name },
          lat, lng,
          message: message || 'SOS! I need help!',
          timestamp: new Date(),
        });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

module.exports = initializeSocket;
