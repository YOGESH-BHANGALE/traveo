'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedToken = localStorage.getItem('traveo_token');
        const savedUser = localStorage.getItem('traveo_user');

        if (!savedToken || !savedUser) {
          // No session — done immediately, no spinner
          setLoading(false);
          return;
        }

        // Restore from cache immediately so UI shows right away
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        connectSocket(savedToken);
        setLoading(false); // unblock UI with cached data

        // Silently verify token in background (5s timeout)
        try {
          const res = await authAPI.getMe();
          setUser(res.data.user);
          localStorage.setItem('traveo_user', JSON.stringify(res.data.user));
        } catch (err) {
          if (err.response?.status === 401) {
            logout();
          }
          // Network error / timeout — keep cached user, don't log out
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (email, password, role) => {
    const res = await authAPI.login({ email, password, role });
    const { token: newToken, user: userData } = res.data;

    setToken(newToken);
    setUser(userData);
    localStorage.setItem('traveo_token', newToken);
    localStorage.setItem('traveo_user', JSON.stringify(userData));
    connectSocket(newToken);

    return userData; // caller uses role to redirect
  }, []);

  const register = useCallback(async (userData) => {
    const res = await authAPI.register(userData);
    const { token: newToken, user: newUser } = res.data;

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('traveo_token', newToken);
    localStorage.setItem('traveo_user', JSON.stringify(newUser));
    connectSocket(newToken);

    return newUser; // caller uses role to redirect
  }, []);

  const loginWithToken = useCallback(async (newToken) => {
    setToken(newToken);
    localStorage.setItem('traveo_token', newToken);
    connectSocket(newToken);

    const res = await authAPI.getMe();
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('traveo_user', JSON.stringify(userData));

    return userData; // caller uses role to redirect
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('traveo_token');
    localStorage.removeItem('traveo_user');
    disconnectSocket();
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedData };
      localStorage.setItem('traveo_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        loginWithToken,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
