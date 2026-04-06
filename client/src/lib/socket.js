import { io } from 'socket.io-client';

// Use same origin if API_URL is empty (proxy mode)
const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

let socket = null;

export const connectSocket = (token) => {
  // Don't connect if no token
  if (!token) {
    console.log('No token provided, skipping socket connection');
    return null;
  }

  if (socket?.connected) return socket;

  try {
    socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 10000, // 10 second timeout
      autoConnect: true,
      path: '/socket.io', // Ensure correct path for proxy
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
    });

    socket.on('connect_error', (error) => {
      // Silently handle connection errors - don't spam console
      if (error.message !== 'Invalid token' && error.message !== 'timeout') {
        console.warn('Socket connection issue:', error.message);
      }
    });

    socket.on('disconnect', (reason) => {
      if (reason !== 'io client disconnect') {
        console.log('Socket disconnected:', reason);
      }
    });

    socket.on('error', (error) => {
      console.warn('Socket error:', error);
    });

    return socket;
  } catch (error) {
    console.error('Failed to create socket:', error);
    return null;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected and cleaned up');
  }
};

export const getSocket = () => socket;

export default { connectSocket, disconnectSocket, getSocket };
