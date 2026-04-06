'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiNavigation, FiStar, FiCalendar, FiLogOut, FiUser, FiPlus
} from 'react-icons/fi';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { tripsAPI, ridesAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const up = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: 'easeOut', delay },
});

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { socket } = useSocket();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    // Redirect drivers to their dashboard
    if (!authLoading && isAuthenticated && user?.role === 'driver') {
      console.log('Redirecting driver to /driver/dashboard');
      router.push('/driver/dashboard');
      return;
    }
    if (isAuthenticated) fetchDashboard();
  }, [isAuthenticated, authLoading, user?.role]);

  // Real-time: new booking notification and ride confirmed
  useEffect(() => {
    if (!socket) return;
    const handleRideConfirmed = ({ ride, rideId }) => {
      const id = rideId || ride?._id;
      toast.success('Ride confirmed! Opening chat...');
      if (id) router.push(`/chat?rideId=${id}`);
      else router.push('/rides');
    };
    socket.on('ride_confirmed', handleRideConfirmed);
    return () => {
      socket.off('ride_confirmed', handleRideConfirmed);
    };
  }, [socket]);

  const fetchDashboard = async () => {
    try {
      // Fetch trips and rides data
      const [tripsRes, ridesRes] = await Promise.all([
        tripsAPI.getMyTrips(),
        ridesAPI.getMyRides()
      ]);
      
      const trips = tripsRes.data.trips || [];
      const rides = ridesRes.data.rides || [];
      
      // Calculate stats
      const totalTrips = trips.length;
      const completedRides = rides.filter(r => r.status === 'completed').length;
      const rating = 5.0; // Default rating
      
      setDashboard({
        totalTrips,
        completedRides,
        rating,
        recentRides: rides.slice(0, 4),
        recentTrips: trips.slice(0, 4)
      });
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
    toast.success('Logged out');
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
    </div>
  );

  const firstName = user?.name?.split(' ')[0] || 'Rider';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      {/* Header */}
      <div className="bg-brand-900 border-b border-brand-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src="/traveo-icon.svg" alt="Traveo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-black text-white text-base tracking-tight">Traveo</span>
              <span className="ml-2 text-xs bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded-full">Rider</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile"
              className="w-9 h-9 bg-brand-700 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden ring-2 ring-brand-600">
              {user?.profilePhoto
                ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                : <span className="text-accent-400">{firstName[0]?.toUpperCase()}</span>}
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-28">
        {/* Greeting */}
        <motion.div {...up(0)} className="pt-5 pb-4">
          <p className="text-sm text-brand-400 font-medium">{greeting} 👋</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-2xl font-black text-white">{firstName}</h1>
          </div>
          <p className="text-sm text-brand-400 mt-1">Where are you headed today?</p>
        </motion.div>

        {/* Stats - WITHOUT earnings */}
        <motion.div {...up(0.05)} className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'Total Trips', value: dashboard?.totalTrips || 0, color: 'text-green-400' },
            { label: 'Completed', value: dashboard?.completedRides || 0, color: 'text-accent-400' },
            { label: 'Rating', value: (dashboard?.rating || 5.0).toFixed(1), color: 'text-blue-400' },
          ].map((s) => (
            <div key={s.label} className="bg-brand-800 border border-brand-700 rounded-2xl p-3 text-center">
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-brand-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div {...up(0.12)} className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/trips/new"
            className="relative overflow-hidden bg-accent-400 rounded-2xl p-4 active:scale-[0.97] transition-transform shadow-lg shadow-accent-400/20">
            <div className="absolute -right-3 -top-3 w-16 h-16 bg-accent-300/30 rounded-full" />
            <div className="w-10 h-10 bg-brand-900/20 rounded-xl flex items-center justify-center mb-3">
              <FiCalendar size={22} className="text-brand-900" />
            </div>
            <div className="font-black text-brand-900 text-base">Post Trip</div>
            <div className="text-xs text-brand-800 mt-0.5 font-medium">Schedule a ride</div>
          </Link>

          <Link href="/rides"
            className="relative overflow-hidden bg-brand-800 border border-brand-700 rounded-2xl p-4 active:scale-[0.97] transition-transform">
            <div className="absolute -right-3 -top-3 w-16 h-16 bg-brand-700/50 rounded-full" />
            <div className="w-10 h-10 bg-brand-700 rounded-xl flex items-center justify-center mb-3">
              <FiNavigation size={20} className="text-accent-400" />
            </div>
            <div className="font-black text-white text-base">My Rides</div>
            <div className="text-xs text-brand-400 mt-0.5">View bookings</div>
          </Link>
        </motion.div>

        {/* Secondary actions */}
        <motion.div {...up(0.15)} className="grid grid-cols-2 gap-2 mb-6">
          <Link href="/explore"
            className="bg-brand-800 border border-brand-700 rounded-2xl p-3 text-center active:scale-[0.97] transition-transform">
            <FiNavigation size={20} className="text-accent-400 mx-auto mb-1" />
            <div className="text-xs font-bold text-white">Explore</div>
          </Link>
          <Link href="/profile"
            className="bg-brand-800 border border-brand-700 rounded-2xl p-3 text-center active:scale-[0.97] transition-transform">
            <FiUser size={20} className="text-brand-400 mx-auto mb-1" />
            <div className="text-xs font-bold text-white">Profile</div>
          </Link>
        </motion.div>

        {/* Recent rides */}
        {dashboard?.recentRides?.length > 0 && (
          <motion.section {...up(0.18)} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-brand-300 uppercase tracking-wider">Recent Rides</h2>
              <Link href="/rides" className="text-xs text-accent-400 font-bold">See all →</Link>
            </div>
            <div className="space-y-2">
              {dashboard.recentRides.map((ride) => (
                <Link 
                  key={ride._id} 
                  href={`/rides?rideId=${ride._id}`}
                  className="bg-brand-900 border border-brand-800 rounded-xl p-3 flex items-center justify-between hover:border-brand-700 transition-colors active:scale-[0.98] cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-semibold text-white">{ride.rideCode}</p>
                    <p className="text-xs text-brand-500">{new Date(ride.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent-400">₹{ride.farePerPerson}</p>
                    <p className={`text-xs ${ride.status === 'completed' ? 'text-green-400' : 'text-brand-400'}`}>{ride.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Posted Trips */}
        {dashboard?.recentTrips?.length > 0 && (
          <motion.section {...up(0.2)} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-brand-300 uppercase tracking-wider">My Posted Trips</h2>
              <Link href="/trips/new" className="text-xs text-accent-400 font-bold">Post new →</Link>
            </div>
            <div className="space-y-2">
              {dashboard.recentTrips.map((trip) => {
                const statusColors = {
                  open: 'text-green-400',
                  partially_filled: 'text-blue-400',
                  full: 'text-purple-400',
                  started: 'text-accent-400',
                  in_progress: 'text-accent-400',
                  completed: 'text-green-400',
                  cancelled: 'text-red-400',
                  closed: 'text-brand-500'
                };
                const statusColor = statusColors[trip.status] || 'text-brand-400';
                
                return (
                  <Link key={trip._id} href={`/trips/${trip._id}`}
                    className="bg-brand-900 border border-brand-800 rounded-xl p-3 flex items-start gap-3 hover:border-brand-700 transition-colors active:scale-[0.98]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold text-white truncate">
                          {trip.source?.landmark || trip.source?.address?.split(',')[0]}
                        </p>
                        <span className="text-brand-600">→</span>
                        <p className="text-xs text-brand-400 truncate">
                          {trip.destination?.landmark || trip.destination?.address?.split(',')[0]}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-brand-500">
                        <span>{new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        <span>•</span>
                        <span>{trip.time}</span>
                        <span>•</span>
                        <span>{trip.bookedSeats || 0}/{trip.seats} seats</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-bold ${statusColor} capitalize`}>
                        {trip.status.replace('_', ' ')}
                      </p>
                      {trip.estimatedFare && (
                        <p className="text-xs text-brand-500 mt-0.5">₹{trip.estimatedFare}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Logout */}
        <motion.div {...up(0.22)}>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20 active:scale-[0.97] transition-all">
            <FiLogOut size={16} /> Log Out
          </button>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
