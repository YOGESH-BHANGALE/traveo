'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiPlus, FiMapPin, FiClock, FiUsers,
  FiNavigation, FiCalendar, FiArrowRight, FiStar, FiCheck, FiMessageSquare, FiCheckCircle
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

const VEHICLE_ICONS = { car: '🚗', bike: '🏍️', auto: '🛺', any: '🚐' };

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const [myTrips, setMyTrips] = useState([]);
  const [nearbyTrips, setNearbyTrips] = useState([]);
  // allMyRides = ALL rides regardless of status (active + past)
  const [allMyRides, setAllMyRides] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [userLocation, setUserLocation] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!isAuthenticated) return;

    // Redirect drivers to their dashboard
    if (user?.role === 'driver') {
      console.log('Redirecting driver to /driver/dashboard');
      router.push('/driver/dashboard');
      return;
    }

    const fetchAll = () => {
      tripsAPI.getMyTrips()
        .then((res) => setMyTrips(res.data.trips || []))
        .catch(console.error)
        .finally(() => setLoading(false));

      // Fetch ALL rides (active + completed) so connections section never disappears
      ridesAPI.getMyRides()
        .then((res) => setAllMyRides(res.data.rides || []))
        .catch(console.error);

      tripsAPI.getMySentRequests()
        .then((res) => setSentRequests(res.data.matches || []))
        .catch(console.error);
    };

    fetchAll();

    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchAll(); };
    document.addEventListener('visibilitychange', handleVisibility);

    if (!navigator.geolocation) { setLocationDenied(true); return () => document.removeEventListener('visibilitychange', handleVisibility); }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        tripsAPI.search({ userLat: loc.lat, userLng: loc.lng, radius: 1500 })
          .then((res) => setNearbyTrips(res.data.trips || []))
          .catch(() => {});
      },
      () => setLocationDenied(true),
      { timeout: 8000, maximumAge: 60000 }
    );

    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isAuthenticated, authLoading, user?.role]);

  // Real-time: new nearby trip posted → add to nearbyTrips (role-filtered)
  useEffect(() => {
    if (!socket || !userLocation) return;
    const handleTripNearby = ({ trip, posterRole }) => {
      // Visibility rule: drivers only see rider-posted trips
      if (user?.role === 'driver' && posterRole === 'driver') return;
      // Don't show own trips
      if (trip.user?._id === user?._id || trip.user === user?._id) return;
      // Check within 1.5 km
      const R = 6371000;
      const dLat = ((trip.source?.lat - userLocation.lat) * Math.PI) / 180;
      const dLng = ((trip.source?.lng - userLocation.lng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((userLocation.lat * Math.PI) / 180) * Math.cos((trip.source?.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (dist > 1500) return;
      setNearbyTrips((prev) => {
        if (prev.some((t) => t._id === trip._id)) return prev;
        toast(`New ${posterRole === 'driver' ? '🧑‍✈️ Driver' : '🧑‍💼 Rider'} ride nearby!`, { icon: '📍', duration: 3000 });
        return [trip, ...prev];
      });
    };
    socket.on('trip_nearby', handleTripNearby);
    return () => socket.off('trip_nearby', handleTripNearby);
  }, [socket, userLocation, user]);

  // Real-time: incoming connection request (trip owner gets notified)
  useEffect(() => {
    if (!socket) return;
    const handleNewRequest = ({ fromUser, tripId }) => {
      toast(`${fromUser?.name?.split(' ')[0] || 'Someone'} wants to join your trip! 🔔`, { icon: '🤝', duration: 4000 });
      tripsAPI.getMyTrips().then((res) => setMyTrips(res.data.trips || [])).catch(console.error);
    };
    socket.on('new_connection_request', handleNewRequest);
    return () => socket.off('new_connection_request', handleNewRequest);
  }, [socket]);

  // Real-time: ride confirmed → refresh + navigate to chat
  useEffect(() => {
    if (!socket) return;
    const handleRideConfirmed = ({ rideId, ride: confirmedRide }) => {
      const id = rideId || confirmedRide?._id;
      toast.success('Ride confirmed! Opening chat...');
      ridesAPI.getMyRides().then((res) => setAllMyRides(res.data.rides || [])).catch(console.error);
      tripsAPI.getMySentRequests().then((res) => setSentRequests(res.data.matches || [])).catch(console.error);
      if (id) setTimeout(() => router.push(`/chat?rideId=${id}`), 600);
    };
    // Ride started → refresh rides list
    const handleRideStarted = () => {
      ridesAPI.getMyRides().then((res) => setAllMyRides(res.data.rides || [])).catch(console.error);
    };
    // Ride completed → optimistic update immediately, then re-fetch to confirm
    const handleRideCompleted = ({ rideId }) => {
      // Immediately update the ride status in local state so UI reflects instantly
      setAllMyRides((prev) =>
        prev.map((r) =>
          r._id?.toString() === rideId?.toString()
            ? { ...r, status: 'completed' }
            : r
        )
      );
      // Then re-fetch from server to get accurate data
      ridesAPI.getMyRides().then((res) => setAllMyRides(res.data.rides || [])).catch(console.error);
    };
    socket.on('ride_confirmed', handleRideConfirmed);
    socket.on('ride_started', handleRideStarted);
    socket.on('ride_completed', handleRideCompleted);
    return () => {
      socket.off('ride_confirmed', handleRideConfirmed);
      socket.off('ride_started', handleRideStarted);
      socket.off('ride_completed', handleRideCompleted);
    };
  }, [socket]);

  const handleConnect = async (trip) => {
    setConnecting(trip._id);
    try {
      await tripsAPI.connect(trip._id, {});
      setConnectedIds((p) => new Set([...p, trip._id]));
      toast.success(`Request sent to ${trip.user?.name?.split(' ')[0]}! 🎉\nWaiting for their response.`, { duration: 4000 });
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('already exists')) {
        setConnectedIds((p) => new Set([...p, trip._id]));
        toast('You already sent a request to this trip.', { icon: 'ℹ️', duration: 3000 });
      } else if (msg.includes('No seats available')) {
        toast.error('No seats left on this trip.', { duration: 3000 });
      } else if (msg.includes('no longer active')) {
        toast.error('This trip is no longer active.', { duration: 3000 });
      } else if (msg.includes('Drivers cannot')) {
        toast.error('Drivers cannot connect to other driver trips.', { duration: 3500 });
      } else {
        toast.error(msg || 'Failed to send request. Try again.', { duration: 3000 });
      }
    } finally { setConnecting(null); }
  };

  const handleCancelTrip = async (tripId, e) => {
    e.preventDefault(); // prevent Link navigation
    e.stopPropagation();
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Cancel this trip?</p>
        <p className="text-xs text-brand-400">This will remove it from search results.</p>
        <div className="flex gap-2 mt-1">
          <button onClick={async () => {
            toast.dismiss(t.id);
            setCancelling(tripId);
            try {
              await tripsAPI.cancel(tripId);
              setMyTrips((prev) => prev.filter((t) => t._id !== tripId));
              toast.success('Trip cancelled.', { duration: 3000 });
            } catch (err) {
              toast.error(err.response?.data?.message || 'Failed to cancel trip.', { duration: 3000 });
            } finally { setCancelling(null); }
          }} className="flex-1 bg-red-500 text-white text-xs font-bold py-1.5 rounded-lg">
            Yes, cancel
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 bg-brand-700 text-brand-300 text-xs font-bold py-1.5 rounded-lg">
            Keep it
          </button>
        </div>
      </div>
    ), { duration: 8000, style: { background: '#1a1a2e', border: '1px solid #2d2d44', color: '#fff' } });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-brand-950">
        <div className="bg-brand-900 border-b border-brand-800 px-4 py-3 flex items-center justify-between max-w-2xl mx-auto">
          <div className="skeleton w-24 h-7 rounded-lg" />
          <div className="skeleton w-9 h-9 rounded-full" />
        </div>
        <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
          <div className="skeleton w-32 h-5 rounded-lg" />
          <div className="skeleton w-48 h-8 rounded-lg" />
          <div className="grid grid-cols-3 gap-2">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
          <div className="grid grid-cols-2 gap-3"><div className="skeleton h-28 rounded-2xl" /><div className="skeleton h-28 rounded-2xl" /></div>
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  const activeTrips = myTrips.filter((t) => 
    ['open', 'partially_filled', 'full'].includes(t.status)
  );
  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ── Build "My Connections" section ──────────────────────────────────────────
  // Sort all rides newest first (API already does this, but be explicit)
  const sortedRides = [...allMyRides].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // ONE entry per companion — most recent ride wins (could be active or past)
  const seenCompanionIds = new Set();
  const dedupedRides = sortedRides.filter((ride) => {
    const companion = ride.users?.find((u) => {
      const uid = u.user?._id?.toString() || u.user?.toString();
      return uid !== user?._id?.toString();
    });
    const cid = companion?.user?._id?.toString() || companion?.user?.toString();
    if (!cid || seenCompanionIds.has(cid)) return false;
    seenCompanionIds.add(cid);
    return true;
  });

  // Sent requests (joiner perspective) — only show if no ride exists for that trip yet
  const rideCompanionIds = new Set(
    dedupedRides.flatMap((r) =>
      r.users?.map((u) => u.user?._id?.toString() || u.user?.toString()).filter(Boolean) || []
    )
  );
  const seenReqTrips = new Set();
  const dedupedAccepted = sentRequests.filter((m) => {
    if (m.status !== 'accepted' || !m.rideId) return false;
    const tripOwnerId = m.trip?.user?._id?.toString() || m.trip?.user?.toString();
    if (tripOwnerId && rideCompanionIds.has(tripOwnerId)) return false; // already shown via ride
    const tid = m.trip?._id?.toString() || m.trip?.toString();
    if (seenReqTrips.has(tid)) return false;
    seenReqTrips.add(tid);
    return true;
  });
  const seenPendingTrips = new Set();
  const dedupedPending = sentRequests.filter((m) => {
    if (m.status !== 'pending') return false;
    const tid = m.trip?._id?.toString() || m.trip?.toString();
    if (seenPendingTrips.has(tid)) return false;
    seenPendingTrips.add(tid);
    return true;
  });

  const hasConnections = dedupedRides.length > 0 || dedupedAccepted.length > 0 || dedupedPending.length > 0;

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      {/* Header */}
      <div className="bg-brand-900 border-b border-brand-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src="/traveo-icon.svg" alt="Traveo" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-white text-lg tracking-tight">Traveo</span>
          </div>
          <Link href="/profile">
            <div className="w-9 h-9 bg-brand-700 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden ring-2 ring-brand-600">
              {user?.profilePhoto
                ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                : <span className="text-accent-400">{firstName[0]?.toUpperCase()}</span>}
            </div>
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-28">
        {/* Greeting */}
        <motion.div {...up(0)} className="pt-5 pb-4">
          <p className="text-sm text-brand-400 font-medium">{greeting} 👋</p>
          <h1 className="text-2xl font-black text-white mt-0.5">{firstName}</h1>
          <p className="text-sm text-brand-400 mt-1">Where are you headed today?</p>
        </motion.div>

        {/* Stats */}
        <motion.div {...up(0.05)} className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'Active', value: activeTrips.length, color: 'text-accent-400' },
            { label: 'Nearby', value: nearbyTrips.length, color: 'text-green-400' },
            { label: 'Total', value: myTrips.length, color: 'text-brand-300' },
          ].map((s) => (
            <div key={s.label} className="bg-brand-800 border border-brand-700 rounded-2xl p-3 text-center">
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-brand-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div {...up(0.1)} className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/trips/new"
            className="relative overflow-hidden bg-accent-400 rounded-2xl p-4 active:scale-[0.97] transition-transform shadow-lg shadow-accent-400/20">
            <div className="absolute -right-3 -top-3 w-16 h-16 bg-accent-300/30 rounded-full" />
            <div className="absolute -right-1 -bottom-5 w-12 h-12 bg-accent-300/20 rounded-full" />
            <div className="w-10 h-10 bg-brand-900/20 rounded-xl flex items-center justify-center mb-3">
              <FiPlus size={22} className="text-brand-900" />
            </div>
            <div className="font-black text-brand-900 text-base">Post Trip</div>
            <div className="text-xs text-brand-800 mt-0.5 font-medium">Share your ride</div>
          </Link>
          <Link href="/explore"
            className="relative overflow-hidden bg-brand-800 border border-brand-700 rounded-2xl p-4 active:scale-[0.97] transition-transform">
            <div className="absolute -right-3 -top-3 w-16 h-16 bg-brand-700/50 rounded-full" />
            <div className="w-10 h-10 bg-brand-700 rounded-xl flex items-center justify-center mb-3">
              <FiNavigation size={20} className="text-accent-400" />
            </div>
            <div className="font-black text-white text-base">Explore</div>
            <div className="text-xs text-brand-400 mt-0.5">Find rides nearby</div>
          </Link>
        </motion.div>

        {/* DITMATE+ Quick Access — rider only */}
        <motion.div {...up(0.12)} className="mb-6">
          <Link href="/autoshare"
            className="bg-brand-800 border border-brand-700 rounded-2xl p-3 text-center active:scale-[0.97] transition-transform block">
            <div className="text-2xl mb-1">🛺</div>
            <div className="text-xs font-bold text-white">Ride Now</div>
            <div className="text-[10px] text-brand-500">AutoShare</div>
          </Link>
        </motion.div>

        {/* My Active Trips */}
        <motion.section {...up(0.15)} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-brand-300 uppercase tracking-wider">My Active Trips</h2>
            <Link href="/trips/new" className="text-xs text-accent-400 font-bold flex items-center gap-1">
              <FiPlus size={12} /> New
            </Link>
          </div>
          {activeTrips.length === 0 ? (
            <div className="bg-brand-800 border border-dashed border-brand-600 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FiMapPin className="text-brand-500" size={22} />
              </div>
              <p className="text-sm font-semibold text-brand-300 mb-1">No active trips</p>
              <p className="text-xs text-brand-500 mb-4">Post a trip to find travel buddies</p>
              <Link href="/trips/new" className="inline-flex items-center gap-1.5 bg-accent-400 text-brand-900 text-sm font-bold px-4 py-2 rounded-xl">
                <FiPlus size={14} /> Post Your First Trip
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeTrips.map((trip) => (
                <div key={trip._id} className="relative">
                  <Link href={`/trips/${trip._id}`}>
                  <div className="bg-brand-800 border border-brand-700 rounded-2xl p-4 hover:border-brand-600 active:scale-[0.98] transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-green-400">Active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-brand-400">{VEHICLE_ICONS[trip.vehicleType]}</span>
                        {trip.estimatedFare > 0 && (
                          <span className="text-xs font-bold text-accent-400 bg-accent-400/10 px-2 py-0.5 rounded-lg">₹{Math.ceil(trip.estimatedFare / (trip.seats || 1))}/person</span>
                        )}
                        <button
                          onClick={(e) => handleCancelTrip(trip._id, e)}
                          disabled={cancelling === trip._id}
                          className="text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          {cancelling === trip._id ? '...' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <div className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                        <div className="w-0.5 h-6 bg-brand-600" />
                        <div className="w-2.5 h-2.5 bg-accent-400 rounded-full" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-white font-semibold truncate">{trip.source?.landmark || trip.source?.address?.split(',')[0]}</p>
                        <p className="text-xs text-brand-500 truncate">{trip.source?.area || trip.source?.address?.split(',').slice(1,2).join(',').trim()}</p>
                        <p className="text-sm text-brand-400 truncate">{trip.destination?.landmark || trip.destination?.address?.split(',')[0]}</p>
                        <p className="text-xs text-brand-500 truncate">{trip.destination?.area || trip.destination?.address?.split(',').slice(1,2).join(',').trim()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-brand-500">
                      <span className="flex items-center gap-1"><FiCalendar size={11} />{new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <span className="flex items-center gap-1"><FiClock size={11} />{trip.time}</span>
                      <span className="ml-auto text-accent-400 font-bold flex items-center gap-1">Matches <FiArrowRight size={11} /></span>
                    </div>
                  </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* My Connections — visible to ALL users, shows active + past rides + pending requests */}
        {hasConnections && (
          <motion.section {...up(0.18)} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-brand-300 uppercase tracking-wider">My Connections</h2>
              <Link href="/rides" className="text-xs text-accent-400 font-bold flex items-center gap-1">
                See all <FiArrowRight size={12} />
              </Link>
            </div>

            {/* Complete All Rides Button - Only show if there are in-progress rides */}
            {allMyRides.some(r => r.status === 'in_progress') && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mb-3"
              >
                <button
                  onClick={async () => {
                    const inProgressRides = allMyRides.filter(r => r.status === 'in_progress');
                    if (inProgressRides.length === 0) return;
                    
                    try {
                      await Promise.all(inProgressRides.map(ride => ridesAPI.complete(ride._id)));
                      toast.success(`${inProgressRides.length} ride${inProgressRides.length > 1 ? 's' : ''} completed! 🎉`, { duration: 4000 });
                      // Refresh rides
                      const res = await ridesAPI.getMyRides();
                      setAllMyRides(res.data.rides || []);
                    } catch (error) {
                      toast.error('Failed to complete some rides');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-2.5 rounded-xl active:scale-[0.98] transition-all text-sm shadow-lg"
                >
                  <FiCheckCircle size={16} />
                  Complete All Rides ({allMyRides.filter(r => r.status === 'in_progress').length})
                </button>
              </motion.div>
            )}

            <div className="space-y-2.5">

              {/* One card per companion — most recent ride status drives the UI */}
              {dedupedRides.map((ride) => {
                const companion = ride.users?.find((u) => {
                  const uid = u.user?._id?.toString() || u.user?.toString();
                  return uid !== user?._id?.toString();
                });
                const isActive = ['confirmed', 'in_progress'].includes(ride.status);
                const isCompleted = ride.status === 'completed';
                if (isActive) {
                  return (
                    <Link key={ride._id} href={`/chat?rideId=${ride._id}`}>
                      <div className="bg-brand-800 border border-green-500/30 rounded-2xl p-4 hover:border-green-500/50 active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 font-bold flex-shrink-0 overflow-hidden">
                            {companion?.user?.profilePhoto ? <img src={companion.user.profilePhoto} alt="" className="w-full h-full object-cover" /> : companion?.user?.name?.[0] || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">{companion?.user?.name || 'Travel Buddy'}</p>
                            <p className="text-xs text-green-400 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                              {ride.status === 'in_progress' ? 'Ride in progress' : 'Confirmed — tap to chat'}
                            </p>
                          </div>
                          <FiMessageSquare size={18} className="text-accent-400 flex-shrink-0" />
                        </div>
                      </div>
                    </Link>
                  );
                }
                return (
                  <Link key={ride._id} href="/rides">
                    <div className="bg-brand-800 border border-brand-700 rounded-2xl p-4 hover:border-brand-600 active:scale-[0.98] transition-all opacity-80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-700 rounded-full flex items-center justify-center text-brand-400 font-bold flex-shrink-0 overflow-hidden">
                          {companion?.user?.profilePhoto ? <img src={companion.user.profilePhoto} alt="" className="w-full h-full object-cover" /> : companion?.user?.name?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white">{companion?.user?.name || 'Travel Buddy'}</p>
                          <p className={`text-xs font-medium flex items-center gap-1 ${isCompleted ? 'text-green-400' : 'text-red-400'}`}>
                            <FiCheckCircle size={10} />
                            {isCompleted ? 'Ride completed — view history' : 'Ride cancelled'}
                          </p>
                        </div>
                        <FiArrowRight size={16} className="text-brand-500 flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* Accepted sent requests — only shown if no ride document found yet */}
              {dedupedAccepted.map((match) => (
                <Link key={match._id} href={`/chat?rideId=${match.rideId}`}>
                  <div className="bg-brand-800 border border-green-500/30 rounded-2xl p-4 hover:border-green-500/50 active:scale-[0.98] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 font-bold flex-shrink-0 overflow-hidden">
                        {match.trip?.user?.profilePhoto ? <img src={match.trip.user.profilePhoto} alt="" className="w-full h-full object-cover" /> : match.trip?.user?.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{match.trip?.user?.name || 'Travel Buddy'}</p>
                        <p className="text-xs text-green-400 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          Confirmed — tap to chat
                        </p>
                      </div>
                      <FiMessageSquare size={18} className="text-accent-400 flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              ))}

              {/* Pending sent requests */}
              {dedupedPending.map((match) => (
                <div key={match._id} className="bg-brand-800 border border-brand-700 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-700 rounded-full flex items-center justify-center text-accent-400 font-bold flex-shrink-0 overflow-hidden">
                      {match.trip?.user?.profilePhoto ? <img src={match.trip.user.profilePhoto} alt="" className="w-full h-full object-cover" /> : match.trip?.user?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{match.trip?.user?.name}</p>
                      <p className="text-xs text-brand-400 truncate">{match.trip?.source?.landmark || match.trip?.source?.address?.split(',')[0]} → {match.trip?.destination?.landmark || match.trip?.destination?.address?.split(',')[0]}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-accent-400 font-medium">
                      <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse" />
                      Pending
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </motion.section>
        )}

        {/* Nearby Rides */}
        <motion.section {...up(0.2)}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-brand-300 uppercase tracking-wider">Rides Nearby</h2>
              <p className="text-xs mt-0.5 flex items-center gap-1">
                {userLocation
                  ? <><span className="w-1.5 h-1.5 bg-green-400 rounded-full" /><span className="text-green-400">Within 1.5 km</span></>
                  : <span className="text-brand-500">Enable location for nearby results</span>}
              </p>
            </div>
            <Link href="/explore" className="text-xs text-accent-400 font-bold flex items-center gap-1">
              See all <FiArrowRight size={12} />
            </Link>
          </div>
          {nearbyTrips.length === 0 ? (
            <div className="bg-brand-800 border border-dashed border-brand-600 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FiNavigation className="text-brand-500" size={22} />
              </div>
              <p className="text-sm text-brand-400">
                {locationDenied ? 'Allow location to see nearby rides' : 'No trips within 1.5 km right now'}
              </p>
              <Link href="/explore" className="mt-3 inline-block text-xs text-accent-400 font-bold">Browse all rides →</Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {nearbyTrips.slice(0, 4).map((trip, i) => {
                const isConnected = connectedIds.has(trip._id);
                const isConnecting = connecting === trip._id;
                // Also treat as connected if a sent request already exists for this trip
                const alreadyRequested = sentRequests.some(
                  (m) => (m.trip?._id?.toString() || m.trip?.toString()) === trip._id?.toString()
                );
                const showSent = isConnected || alreadyRequested;
                return (
                  <motion.div key={trip._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                    className="bg-brand-800 border border-brand-700 rounded-2xl p-4 hover:border-brand-600 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-brand-700 rounded-full flex items-center justify-center text-accent-400 text-sm font-black flex-shrink-0 overflow-hidden">
                        {trip.user?.profilePhoto ? <img src={trip.user.profilePhoto} alt="" className="w-full h-full object-cover" /> : trip.user?.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold text-white">{trip.user?.name}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            trip.user?.role === 'driver'
                              ? 'bg-accent-400/15 text-accent-400'
                              : 'bg-blue-500/15 text-blue-400'
                          }`}>
                            {trip.user?.role === 'driver' ? '🧑‍✈️ Driver' : '🧑‍💼 Rider'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-brand-400">
                          <FiStar className="text-accent-400 fill-accent-400" size={10} />
                          <span>{trip.user?.rating || '5.0'}</span>
                          <span>·</span>
                          <span>{VEHICLE_ICONS[trip.vehicleType]} {trip.vehicleType}</span>
                        </div>
                      </div>
                      {trip.estimatedFare > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-black text-accent-400">₹{Math.ceil(trip.estimatedFare / (trip.seats || 1))}</div>
                          <div className="text-xs text-brand-500">per person</div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 mb-3">
                      <div className="flex flex-col items-center gap-1 pt-0.5">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <div className="w-0.5 h-5 bg-brand-600" />
                        <div className="w-2 h-2 bg-accent-400 rounded-full" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <p className="text-xs text-brand-200 font-medium truncate">{trip.source?.landmark || trip.source?.address?.split(',')[0]}</p>
                        <p className="text-[10px] text-brand-500 truncate">{trip.source?.area || trip.source?.address?.split(',').slice(1,2).join(',').trim()}</p>
                        <p className="text-xs text-brand-400 truncate">{trip.destination?.landmark || trip.destination?.address?.split(',')[0]}</p>
                        <p className="text-[10px] text-brand-500 truncate">{trip.destination?.area || trip.destination?.address?.split(',').slice(1,2).join(',').trim()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-brand-500">
                        <span className="flex items-center gap-1"><FiClock size={11} />{trip.time}</span>
                        <span className="flex items-center gap-1"><FiUsers size={11} />{trip.availableSeats} seats</span>
                      </div>
                      <button onClick={() => handleConnect(trip)} disabled={showSent || isConnecting}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-50 ${
                          showSent ? 'bg-green-400/10 text-green-400 border border-green-400/30' : 'bg-accent-400 text-brand-900 shadow-sm shadow-accent-400/20'
                        }`}>
                        {isConnecting ? <div className="w-3 h-3 border-2 border-brand-900/30 border-t-brand-900 rounded-full animate-spin" />
                          : showSent ? <><FiCheck size={11} /> Sent</> : 'Connect'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>
      </main>
      <BottomNav />
    </div>
  );
}
