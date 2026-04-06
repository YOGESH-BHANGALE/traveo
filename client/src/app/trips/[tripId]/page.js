'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiMapPin, FiClock, FiUsers, FiCalendar, FiArrowLeft,
  FiCheck, FiX, FiPlay, FiLock, FiSettings
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { tripsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId;
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const [trip, setTrip] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (isAuthenticated && tripId) {
      fetchTripDetails();
    }
  }, [isAuthenticated, authLoading, tripId]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('seat_booked', ({ trip: tripIdFromSocket }) => {
      if (tripIdFromSocket === tripId) {
        toast.success('New booking received!');
        fetchTripDetails();
      }
    });

    socket.on('booking_cancelled', ({ trip: tripIdFromSocket }) => {
      if (tripIdFromSocket === tripId) {
        toast.info('A booking was cancelled');
        fetchTripDetails();
      }
    });

    socket.on('new_connection_request', ({ tripId: tripIdFromSocket }) => {
      if (tripIdFromSocket === tripId) {
        toast.success('New connection request!');
        fetchTripDetails();
      }
    });

    return () => {
      socket.off('seat_booked');
      socket.off('booking_cancelled');
      socket.off('new_connection_request');
    };
  }, [socket, tripId]);

  const fetchTripDetails = async () => {
    try {
      console.log('Fetching trip details for tripId:', tripId);
      const tripRes = await tripsAPI.getTrip(tripId);
      console.log('Trip fetched:', tripRes.data.trip);
      setTrip(tripRes.data.trip);
      
      // Try to fetch bookings (driver-only feature)
      try {
        const bookingsRes = await tripsAPI.getBookings(tripId);
        console.log('Bookings fetched:', bookingsRes.data);
        setBookings(bookingsRes.data);
      } catch (bookErr) {
        console.log('Bookings not available:', bookErr.response?.data?.message || bookErr.message);
        setBookings(null);
      }
      
      // Try to fetch matches (for trip owner)
      try {
        console.log('Fetching matches for tripId:', tripId);
        const matchesRes = await tripsAPI.getTripMatches(tripId);
        console.log('Matches API response:', matchesRes.data);
        console.log('Matches loaded:', matchesRes.data.matches);
        setMatches(matchesRes.data.matches || []);
      } catch (matchErr) {
        console.error('Matches fetch error:', matchErr);
        console.log('Matches error response:', matchErr.response?.data);
        console.log('Matches not available:', matchErr.response?.data?.message || matchErr.message);
        setMatches([]);
      }
    } catch (error) {
      console.error('Failed to load trip:', error);
      toast.error('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = async () => {
    setActionLoading('start');
    try {
      await tripsAPI.startTrip(tripId);
      toast.success('Trip started!');
      fetchTripDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start trip');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseTrip = async () => {
    if (!confirm('Are you sure you want to close this trip?')) return;
    
    setActionLoading('close');
    try {
      await tripsAPI.closeTrip(tripId);
      toast.success('Trip closed');
      router.push('/driver/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close trip');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRequest = async (matchId) => {
    setActionLoading(`accept-${matchId}`);
    try {
      const res = await tripsAPI.acceptMatch(matchId);
      toast.success('Request accepted! Opening chat...', { duration: 3000 });
      
      // Get the ride ID from response and open chat
      const rideId = res.data.ride?._id;
      if (rideId) {
        setTimeout(() => {
          router.push(`/chat?rideId=${rideId}`);
        }, 800);
      } else {
        fetchTripDetails();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept request');
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (matchId) => {
    setActionLoading(`reject-${matchId}`);
    try {
      await tripsAPI.rejectMatch(matchId);
      toast.success('Request rejected');
      fetchTripDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-brand-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-brand-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-400">Trip not found</p>
          <button onClick={() => router.back()} className="mt-4 text-accent-400">Go Back</button>
        </div>
      </div>
    );
  }

  // Check ownership - handle both populated and unpopulated user field
  const tripUserId = trip.user?._id?.toString() || trip.user?.toString();
  const currentUserId = user?._id?.toString();
  const isOwner = tripUserId === currentUserId;
  
  const confirmedBookings = bookings?.bookings?.confirmed || [];
  const canStart = isOwner && ['open', 'partially_filled', 'full'].includes(trip.status) && confirmedBookings.length > 0;
  const canClose = isOwner && ['open', 'partially_filled'].includes(trip.status);

  // Debug logging
  console.log('Trip Detail Debug:', {
    isOwner,
    tripUserId,
    currentUserId,
    tripUserObject: trip.user,
    matchesCount: matches.length,
    pendingMatchesCount: matches.filter(m => m.status === 'pending').length,
    matches: matches,
    userRole: user?.role
  });

  const statusColors = {
    open: 'bg-green-500/10 text-green-400 border-green-500/30',
    partially_filled: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    full: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    started: 'bg-accent-400/10 text-accent-400 border-accent-400/30',
    in_progress: 'bg-accent-400/10 text-accent-400 border-accent-400/30',
    completed: 'bg-green-500/10 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
    closed: 'bg-brand-700/50 text-brand-400 border-brand-600'
  };

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      {/* Header */}
      <div className="bg-brand-900 border-b border-brand-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 hover:bg-brand-700 text-brand-300 transition-colors">
            <FiArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Trip Details</h1>
            <p className="text-xs text-brand-400">
              {new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusColors[trip.status]}`}>
            {trip.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-28">
        {/* Route */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-brand-900 rounded-2xl border border-brand-800 p-4 mb-4">
          <div className="flex gap-3">
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div className="w-0.5 flex-1 bg-brand-700 min-h-[40px]" />
              <div className="w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-sm font-semibold text-white">{trip.source?.landmark || 'Pickup'}</p>
                <p className="text-xs text-brand-400 mt-0.5">{trip.source?.area}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{trip.destination?.landmark || 'Destination'}</p>
                <p className="text-xs text-brand-400 mt-0.5">{trip.destination?.area}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trip Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-brand-900 rounded-2xl border border-brand-800 p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-800 rounded-xl flex items-center justify-center">
                <FiCalendar size={18} className="text-accent-400" />
              </div>
              <div>
                <p className="text-xs text-brand-500">Date</p>
                <p className="text-sm font-semibold text-white">
                  {new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-800 rounded-xl flex items-center justify-center">
                <FiClock size={18} className="text-accent-400" />
              </div>
              <div>
                <p className="text-xs text-brand-500">Time</p>
                <p className="text-sm font-semibold text-white">{trip.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-800 rounded-xl flex items-center justify-center">
                <FiUsers size={18} className="text-accent-400" />
              </div>
              <div>
                <p className="text-xs text-brand-500">Seats</p>
                <p className="text-sm font-semibold text-white">
                  {trip.bookedSeats}/{trip.seats} booked
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-800 rounded-xl flex items-center justify-center">
                <span className="text-lg">{trip.vehicleType === 'car' ? '🚗' : trip.vehicleType === 'auto' ? '🛺' : '🏍️'}</span>
              </div>
              <div>
                <p className="text-xs text-brand-500">Vehicle</p>
                <p className="text-sm font-semibold text-white capitalize">{trip.vehicleType}</p>
              </div>
            </div>
          </div>
          {trip.estimatedFare && (
            <div className="mt-4 pt-4 border-t border-brand-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-brand-400">Estimated Fare</span>
                <span className="text-lg font-bold text-accent-400">₹{trip.estimatedFare}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Connection Requests (Owner Only) */}
        {isOwner && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="bg-brand-900 rounded-2xl border border-brand-800 p-4 mb-4">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <FiUsers size={16} />
              Connection Requests ({matches.filter(m => m.status === 'pending').length})
            </h2>
            {matches.filter(m => m.status === 'pending').length === 0 ? (
              <p className="text-sm text-brand-500 text-center py-4">No pending requests</p>
            ) : (
              <div className="space-y-2">
                {matches.filter(m => m.status === 'pending').map((match) => (
                  <div key={match._id}
                    className="flex items-center gap-3 p-3 bg-brand-800 rounded-xl">
                    <div className="w-10 h-10 bg-accent-400 rounded-full flex items-center justify-center text-brand-900 font-bold overflow-hidden">
                      {match.matchedUser?.profilePhoto ? (
                        <img src={match.matchedUser.profilePhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        match.matchedUser?.name?.[0] || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{match.matchedUser?.name}</p>
                      <p className="text-xs text-brand-400">
                        {match.matchedUser?.role === 'driver' ? '🧑‍✈️ Driver' : '🧑‍💼 Rider'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptRequest(match._id)}
                        disabled={actionLoading === `accept-${match._id}`}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {actionLoading === `accept-${match._id}` ? (
                          <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                        ) : (
                          <FiCheck size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(match._id)}
                        disabled={actionLoading === `reject-${match._id}`}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {actionLoading === `reject-${match._id}` ? (
                          <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <FiX size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Bookings (Owner Only) */}
        {isOwner && bookings && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-brand-900 rounded-2xl border border-brand-800 p-4 mb-4">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <FiUsers size={16} />
              Bookings ({confirmedBookings.length})
            </h2>
            {confirmedBookings.length === 0 ? (
              <p className="text-sm text-brand-500 text-center py-4">No bookings yet</p>
            ) : (
              <div className="space-y-2">
                {confirmedBookings.map((booking) => (
                  <div key={booking._id}
                    className="flex items-center gap-3 p-3 bg-brand-800 rounded-xl">
                    <div className="w-10 h-10 bg-accent-400 rounded-full flex items-center justify-center text-brand-900 font-bold overflow-hidden">
                      {booking.rider?.profilePhoto ? (
                        <img src={booking.rider.profilePhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        booking.rider?.name?.[0] || '?'
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{booking.rider?.name}</p>
                      <p className="text-xs text-brand-400">{booking.seatsBooked} seat(s)</p>
                    </div>
                    <span className="text-xs text-green-400 font-semibold">Confirmed</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Actions (Owner Only) */}
        {isOwner && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="space-y-3">
            {canStart && (
              <button onClick={handleStartTrip} disabled={actionLoading === 'start'}
                className="w-full flex items-center justify-center gap-2 bg-accent-400 text-brand-900 font-bold py-3.5 rounded-xl hover:bg-accent-300 active:scale-[0.98] transition-all disabled:opacity-50">
                {actionLoading === 'start' ? (
                  <div className="w-5 h-5 border-2 border-brand-900/30 border-t-brand-900 rounded-full animate-spin" />
                ) : (
                  <><FiPlay size={18} /> Start Trip</>
                )}
              </button>
            )}
            {canClose && (
              <button onClick={handleCloseTrip} disabled={actionLoading === 'close'}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 font-bold py-3.5 rounded-xl hover:bg-red-500/20 active:scale-[0.98] transition-all disabled:opacity-50">
                {actionLoading === 'close' ? (
                  <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                ) : (
                  <><FiLock size={18} /> Close Trip</>
                )}
              </button>
            )}
          </motion.div>
        )}

        {/* Notes */}
        {trip.notes && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-brand-900 rounded-2xl border border-brand-800 p-4 mt-4">
            <h3 className="text-xs font-bold text-brand-400 uppercase mb-2">Notes</h3>
            <p className="text-sm text-brand-300">{trip.notes}</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
