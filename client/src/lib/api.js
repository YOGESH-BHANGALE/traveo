import axios from 'axios';

// Use same origin if API_URL is empty (proxy mode)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  timeout: 30000, // 30s timeout — increased for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('traveo_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('traveo_token');
        localStorage.removeItem('traveo_user');
        // Only redirect if not already on auth pages
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Trips API
export const tripsAPI = {
  create: (data) => api.post('/trips', data),
  search: (params) => api.get('/trips/search', { params }),
  getMyTrips: () => api.get('/trips/my'),
  getTrip: (tripId) => api.get(`/trips/${tripId}`),
  getTripMatches: (tripId) => api.get(`/trips/${tripId}/matches`),
  getMySentRequests: () => api.get('/trips/my/requests'),
  cancel: (tripId) => api.put(`/trips/${tripId}/cancel`),
  connect: (tripId, data) => api.post(`/trips/${tripId}/connect`, data),
  acceptMatch: (matchId) => api.post('/rides/accept', { matchId }),
  rejectMatch: (matchId) => api.post('/rides/reject', { matchId }),
  // Flexible booking endpoints
  bookSeats: (tripId, seatsRequested) => api.post(`/trips/${tripId}/book`, { seatsRequested }),
  cancelBooking: (tripId) => api.post(`/trips/${tripId}/cancel-booking`),
  startTrip: (tripId) => api.post(`/trips/${tripId}/start`),
  closeTrip: (tripId) => api.post(`/trips/${tripId}/close`),
  updateDriverSettings: (tripId, settings) => api.put(`/trips/${tripId}/driver-settings`, settings),
  getBookings: (tripId) => api.get(`/trips/${tripId}/bookings`),
};

// Rides API
export const ridesAPI = {
  accept: (matchId) => api.post('/rides/accept', { matchId }),
  reject: (matchId) => api.post('/rides/reject', { matchId }),
  getMyRides: () => api.get('/rides/my'),
  getRide: (rideId) => api.get(`/rides/${rideId}`),
  start: (rideId) => api.put(`/rides/${rideId}/start`),
  complete: (rideId) => api.put(`/rides/${rideId}/complete`),
  rate: (rideId, data) => api.post(`/rides/${rideId}/rate`, data),
};

// Messages API
export const messagesAPI = {
  send: (data) => api.post('/messages', data),
  getByRide: (rideId, params) => api.get(`/messages/${rideId}`, { params }),
  delete: (messageId, deleteFor) => api.delete(`/messages/${messageId}`, { data: { deleteFor } }),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getPublicProfile: (userId) => api.get(`/users/${userId}`),
  report: (userId, reason) => api.post(`/users/${userId}/report`, { reason }),
  subscribePush: (subscription) => api.post('/users/subscribe', { subscription }),
};

// Auto API
export const autoAPI = {
  start: (data) => api.post('/auto/start', data),
  goOffline: (autoId) => api.put(`/auto/${autoId}/offline`),
  depart: (autoId) => api.put(`/auto/${autoId}/depart`),
  complete: (autoId) => api.put(`/auto/${autoId}/complete`),
  getNearby: (params) => api.get('/auto/nearby', { params }),
  getAuto: (autoId) => api.get(`/auto/${autoId}`),
  bookSeat: (autoId, data) => api.post(`/auto/${autoId}/book`, data),
  cancelBooking: (bookingId) => api.put(`/auto/booking/${bookingId}/cancel`),
  getDriverActive: () => api.get('/auto/driver/active'),
  getMyBookings: () => api.get('/auto/my/bookings'),
};

// Payment API
export const paymentAPI = {
  createOrder: (data) => api.post('/payment/create-order', data),
  verify: (data) => api.post('/payment/verify', data),
  getHistory: () => api.get('/payment/history'),
};

// Driver API
export const driverAPI = {
  getDashboard: () => api.get('/driver/dashboard'),
  setMode: (mode) => api.put('/driver/mode', { mode }),
  verify: (data) => api.post('/driver/verify', data),
};

export default api;
