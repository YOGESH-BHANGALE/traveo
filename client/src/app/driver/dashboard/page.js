'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiNavigation, FiDollarSign, FiStar, FiToggleLeft,
  FiToggleRight, FiCalendar, FiZap, FiLogOut, FiUser, FiShield
} from 'react-icons/fi';
import DriverBottomNav from '@/components/DriverBottomNav';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { driverAPI, autoAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const up = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: 'easeOut', delay },
});

export default function DriverDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, updateUser, logout } = useAuth();
  const { socket } = useSocket();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modeLoading, setModeLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    // Redirect riders away from driver dashboard
    if (!authLoading && isAuthenticated && user?.role !== 'driver') {
      router.push('/dashboard');
      return;
    }
    if (isAuthenticated) fetchDashboard();
  }, [isAuthenticated, authLoading, user?.role]);

  // Real-time: new booking notification and ride confirmed
  useEffect(() => {
    if (!socket) return;
    const handleSeatBooked = ({ booking, autoId, availableSeats }) => {
      toast.success(`New booking! Seat ${booking.seatNumber} — ${booking.rider?.name || 'Rider'}`);
      fetchDashboard();
    };
    const handleRideConfirmed = ({ ride, rideId }) => {
      const id = rideId || ride?._id;
      toast.success('Ride confirmed! Opening chat...');
      if (id) router.push(`/chat?rideId=${id}`);
      else router.push('/rides');
    };
    socket.on('seat_booked', handleSeatBooked);
    socket.on('ride_confirmed', handleRideConfirmed);
    return () => {
      socket.off('seat_booked', handleSeatBooked);
      socket.off('ride_confirmed', handleRideConfirmed);
    };
  }, [socket]);

  const fetchDashboard = async () => {
    try {
      const res = await driverAPI.getDashboard();
      setDashboard(res.data.dashboard);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const toggleMode = async () => {
    const newMode = (user?.driverMode || 'car') === 'car' ? 'auto' : 'car';
    setModeLoading(true);
    try {
      await driverAPI.setMode(newMode);
      updateUser({ driverMode: newMode });
      toast.success(`Switched to ${newMode === 'car' ? '🚗 Car' : '🛺 Auto'} mode`);
    } catch { toast.error('Failed to switch mode'); }
    finally { setModeLoading(false); }
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

  const isAutoMode = (user?.driverMode || 'car') === 'auto';
  const firstName = user?.name?.split(' ')[0] || 'Driver';
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
              <span className="font-black text-white text-base tracking-tight">Traveo+</span>
              <span className="ml-2 text-xs bg-accent-400/10 text-accent-400 font-bold px-2 py-0.5 rounded-full">Driver</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/driver/profile"
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
            {user?.driverVerification?.verifiedBadge && (
              <span className="flex items-center gap-1 text-xs bg-accent-400/15 text-accent-400 font-bold px-2 py-0.5 rounded-full border border-accent-400/30">
                <FiShield size={11} /> Verified
              </span>
            )}
          </div>
          <p className="text-sm text-brand-400 mt-1">Ready to drive today?</p>
        </motion.div>

        {/* Verification banner — shown only if not verified */}
        {!user?.driverVerification?.verifiedBadge && (
          <motion.div {...up(0.03)} className="mb-5">
            <Link href="/driver/verify"
              className="flex items-center gap-3 bg-accent-400/10 border border-accent-400/30 rounded-2xl px-4 py-3.5 hover:bg-accent-400/15 transition-colors active:scale-[0.98]">
              <div className="w-10 h-10 bg-accent-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiShield size={20} className="text-accent-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-accent-400">Get Verified Badge</p>
                <p className="text-xs text-brand-400 mt-0.5">Link Aadhar + License → boost bookings by ~30%</p>
              </div>
              <span className="text-xs font-bold text-accent-400 bg-accent-400/20 px-2 py-1 rounded-lg flex-shrink-0">Free →</span>
            </Link>
          </motion.div>
        )}

        {/* Earnings stats */}
        <motion.div {...up(0.05)} className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'Total Earned', value: `₹${dashboard?.totalEarnings || 0}`, color: 'text-accent-400' },
            { label: 'Total Trips', value: dashboard?.totalTrips || 0, color: 'text-green-400' },
            { label: 'Rating', value: (dashboard?.rating || 5.0).toFixed(1), color: 'text-blue-400' },
          ].map((s) => (
            <div key={s.label} className="bg-brand-800 border border-brand-700 rounded-2xl p-3 text-center">
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-brand-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Mode toggle */}
        <motion.div {...up(0.08)} className="bg-brand-900 rounded-2xl border border-brand-800 p-4 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${isAutoMode ? 'bg-accent-400/10' : 'bg-brand-800'}`}>
                {isAutoMode ? '🛺' : '🚗'}
              </div>
              <div>
                <p className="font-bold text-white">{isAutoMode ? 'Auto Mode' : 'Car Mode'}</p>
                <p className="text-xs text-brand-400">{isAutoMode ? 'Live seat booking' : 'Planned ride sharing'}</p>
              </div>
            </div>
            <button onClick={toggleMode} disabled={modeLoading}
              className="flex items-center gap-2 bg-accent-400/10 border border-accent-400/30 text-accent-400 font-semibold px-4 py-2 rounded-xl text-sm disabled:opacity-50">
              {modeLoading
                ? <div className="w-4 h-4 border-2 border-accent-400/30 border-t-accent-400 rounded-full animate-spin" />
                : isAutoMode ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
              Switch
            </button>
          </div>
        </motion.div>

        {/* Active auto session banner */}
        {dashboard?.activeAuto && (
          <motion.div {...up(0.1)} className="bg-brand-900 rounded-2xl border border-green-500/30 p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-green-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Active Session
              </p>
              <span className="text-xs text-brand-400">{dashboard.activeAuto.autoCode}</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-brand-300">{dashboard.activeAuto.availableSeats} seats left</span>
              <span className="text-accent-400 font-bold">₹{dashboard.activeAuto.farePerSeat}/seat</span>
            </div>
            <Link href="/driver/auto-session"
              className="w-full flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 font-semibold py-2.5 rounded-xl text-sm">
              Manage Session →
            </Link>
          </motion.div>
        )}

        {/* Quick actions */}
        <motion.div {...up(0.12)} className="grid grid-cols-2 gap-3 mb-6">
          <Link href={isAutoMode ? '/driver/auto-session' : '/trips/new'}
            className="relative overflow-hidden bg-accent-400 rounded-2xl p-4 active:scale-[0.97] transition-transform shadow-lg shadow-accent-400/20">
            <div className="absolute -right-3 -top-3 w-16 h-16 bg-accent-300/30 rounded-full" />
            <div className="w-10 h-10 bg-brand-900/20 rounded-xl flex items-center justify-center mb-3">
              {isAutoMode ? <FiZap size={22} className="text-brand-900" /> : <FiCalendar size={22} className="text-brand-900" />}
            </div>
            <div className="font-black text-brand-900 text-base">{isAutoMode ? 'Start Session' : 'Post Trip'}</div>
            <div className="text-xs text-brand-800 mt-0.5 font-medium">{isAutoMode ? 'Go online now' : 'Schedule a ride'}</div>
          </Link>

          <Link href="/driver/rides"
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
          <Link href="/driver/earnings"
            className="bg-brand-800 border border-brand-700 rounded-2xl p-3 text-center active:scale-[0.97] transition-transform">
            <FiDollarSign size={20} className="text-accent-400 mx-auto mb-1" />
            <div className="text-xs font-bold text-white">Earnings</div>
          </Link>
          <Link href="/driver/profile"
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
              <Link href="/driver/rides" className="text-xs text-accent-400 font-bold">See all →</Link>
            </div>
            <div className="space-y-2">
              {dashboard.recentRides.slice(0, 4).map((ride) => (
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
              {dashboard.recentTrips.slice(0, 4).map((trip) => {
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

      <DriverBottomNav />
    </div>
  );
}
