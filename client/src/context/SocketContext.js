'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      const s = connectSocket(token);
      if (s) {
        setSocket(s);
        setIsConnected(s.connected);
        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);
        s.on('connect', onConnect);
        s.on('disconnect', onDisconnect);
        s.on('connect_error', onDisconnect);
        return () => {
          s.off('connect', onConnect);
          s.off('disconnect', onDisconnect);
          s.off('connect_error', onDisconnect);
        };
      }
    } else if (socket) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
    }
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
