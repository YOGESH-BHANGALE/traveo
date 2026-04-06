'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMapPin, FiClock, FiUsers, FiStar, FiSearch,
  FiNavigation, FiCheck, FiSliders, FiMap, FiArrowLeft
} from 'react-icons/fi';
import BottomNav from '@/components/BottomNav';
import DriverBottomNav from '@/components/DriverBottomNav';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { tripsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Load map only on client (Leaflet requires window)
const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

const VEHICLE_ICONS = { car: '🚗', bike: '🏍️', auto: '🛺', any: '🚐' };
const VEHICLE_FILTERS = [
  { value: 'all', label: 'All', emoji: '🚦' },
  { value: 'auto', label: 'Auto', emoji: '🛺' },
  { value: 'car', label: 'Car', emoji: '🚗' },
  { value: 'bike', label: 'Bike', emoji: '🏍️' },
];

// Haversine distance in meters (client-side check for incoming socket trips)
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ExplorePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { socket } = useSocket();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const watchIdRef = useRef(null);
  const userLocationRef = useRef(null);
  const fetchDebounceRef = useRef(null);

  // Keep ref in sync so socket handler always has latest location
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);

  // Fetch nearby trips using current location — debounced to avoid server spam
  const fetchNearbyTrips = async (loc) => {
    if (!loc) return;
    clearTimeout(fetchDebounceRef.current);
    fetchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await tripsAPI.search({ userLat: loc.lat, userLng: loc.lng, radius: 2500 }); // 2.5 km radius
        setTrips(res.data.trips || []);
      } catch (_) {}
      finally { setLoading(false); }
    }, 2000); // only re-fetch if location hasn't changed for 2s
  };

  // Start watching real-time location
  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!isAuthenticated) return;

    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      setLocating(false);
      setLoading(false);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocating(false);
        fetchNearbyTrips(loc);
      },
      () => {
        setLocating(false);
        setLoading(false);
        toast.error('Location access denied. Enable location to see nearby rides.');
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    // Hard fallback: if geolocation never responds in 15s, stop spinner
    const fallbackTimer = setTimeout(() => {
      setLocating(false);
      setLoading(false);
    }, 15000);

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      clearTimeout(fetchDebounceRef.current);
      clearTimeout(fallbackTimer);
    };
  }, [isAuthenticated, authLoading]);

  // Listen for real-time new trips from other users
  useEffect(() => {
    if (!socket) return;

    const handleTripNearby = ({ trip, posterRole }) => {
      const loc = userLocationRef.current;
      if (!loc || !trip?.source?.lat) return;

      // Visibility rule: if viewer is a driver, skip trips posted by other drivers
      if (user?.role === 'driver' && posterRole === 'driver') return;

      // Only show if within 2.5 km of our location
      const dist = distanceMeters(loc.lat, loc.lng, trip.source.lat, trip.source.lng);
      if (dist > 2500) return;

      // Don't show our own trips
      if (trip.user?._id === user?._id || trip.user === user?._id) return;

      setTrips((prev) => {
        if (prev.some((t) => t._id === trip._id)) return prev;
        toast(`New ${posterRole === 'driver' ? '🧑‍✈️ Driver' : '🧑‍💼 Rider'} ride nearby from ${trip.user?.name?.split(' ')[0]}!`, { icon: '📍' });
        return [trip, ...prev];
      });
    };

    const handleRideConfirmed = ({ ride, rideId }) => {
      const id = rideId || ride?._id;
      toast.success('Ride confirmed! Opening chat...');
      if (id) router.push(`/chat?rideId=${id}`);
      else router.push('/rides');
    };

    socket.on('trip_nearby', handleTripNearby);
    socket.on('ride_confirmed', handleRideConfirmed);
    return () => {
      socket.off('trip_nearby', handleTripNearby);
      socket.off('ride_confirmed', handleRideConfirmed);
    };
  }, [socket, user]);

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

  const filtered = trips.filter((t) => {
    if (vehicleFilter !== 'all' && t.vehicleType !== vehicleFilter) return false;
    if (dateFilter && new Date(t.date).toDateString() !== new Date(dateFilter).toDateString()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.source?.address?.toLowerCase().includes(q) || t.destination?.address?.toLowerCase().includes(q) || t.user?.name?.toLowerCase().includes(q);
    }
    return true;
  });

  if (authLoading || (locating && loading)) {
    return (
      <div className="min-h-screen bg-brand-950">
        <div className="bg-brand-900 border-b border-brand-800 px-4 pt-4 pb-3 max-w-2xl mx-auto space-y-3">
          <div className="skeleton h-6 w-32 rounded-lg" />
          <div className="skeleton h-10 w-full rounded-xl" />
          <div className="flex gap-2">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-8 w-16 rounded-xl flex-shrink-0" />)}
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
          <div className="flex items-center gap-2 text-brand-400 text-sm mb-2">
            <div className="w-4 h-4 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
            Getting your location...
          </div>
          {[1,2,3].map(i => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      {/* Sticky header */}
      <div className="bg-brand-900 border-b border-brand-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push(user?.role === 'driver' ? '/driver/dashboard' : '/dashboard')} 
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 hover:bg-brand-700 text-brand-300 transition-colors flex-shrink-0"
              >
                <FiArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Explore Rides</h1>
                <p className="text-xs text-brand-400 mt-0.5">
                  {userLocation
                    ? <span className="text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" /> Within 2.5 km · live</span>
                    : <span className="text-amber-400">Waiting for location...</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowMap((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  showMap ? 'border-accent-400 bg-accent-400/10 text-accent-400' : 'border-brand-700 text-brand-400 hover:border-brand-600'
                }`}>
                <FiMap size={14} /> Map
              </button>
              <button onClick={() => setShowDateFilter(!showDateFilter)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  showDateFilter || dateFilter
                    ? 'border-accent-400 bg-accent-400/10 text-accent-400'
                    : 'border-brand-700 text-brand-400 hover:border-brand-600'
                }`}>
                <FiSliders size={14} /> {dateFilter ? new Date(dateFilter).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Filter'}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={16} />
            <input type="text"
              className="w-full bg-brand-800 border border-brand-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 placeholder:text-brand-500"
              placeholder="Search location or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          {/* Date filter */}
          <AnimatePresence>
            {showDateFilter && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
                <div className="flex items-center gap-2 pb-1">
                  <input type="date"
                    className="flex-1 bg-brand-800 border border-brand-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-400"
                    value={dateFilter} min={new Date().toISOString().split('T')[0]} onChange={(e) => setDateFilter(e.target.value)} />
                  {dateFilter && <button onClick={() => setDateFilter('')} className="text-xs text-red-400 font-semibold px-2">Clear</button>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Vehicle chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {VEHICLE_FILTERS.map((v) => (
              <button key={v.value} onClick={() => setVehicleFilter(v.value)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  vehicleFilter === v.value
                    ? 'bg-accent-400 text-brand-900 shadow-sm'
                    : 'bg-brand-800 text-brand-400 hover:bg-brand-700 border border-brand-700'
                }`}>
                <span>{v.emoji}</span> {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-28">
        {/* Live map */}
        <AnimatePresence>
          {showMap && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4 rounded-2xl">
              <MapComponent
                userLocation={userLocation}
                nearbyTrips={filtered}
                height="280px"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* No location state */}
        {!userLocation && !locating && (
          <div className="bg-brand-900 rounded-2xl border border-dashed border-amber-700/50 py-10 text-center mb-4">
            <FiNavigation className="text-amber-400 mx-auto mb-2" size={28} />
            <p className="text-sm text-amber-300 font-medium">Location access required</p>
            <p className="text-xs text-brand-500 mt-1">Enable location in your browser to see nearby rides</p>
          </div>
        )}

        {/* Results count */}
        {userLocation && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-brand-400">{filtered.length} ride{filtered.length !== 1 ? 's' : ''} found</p>
            {(searchQuery || vehicleFilter !== 'all' || dateFilter) && (
              <button onClick={() => { setSearchQuery(''); setVehicleFilter('all'); setDateFilter(''); }} className="text-xs text-accent-400 font-semibold">Clear filters</button>
            )}
          </div>
        )}

        {userLocation && filtered.length === 0 && (
          <div className="bg-brand-900 rounded-2xl border border-dashed border-brand-700 py-14 text-center">
            <div className="w-14 h-14 bg-brand-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FiMapPin className="text-brand-600" size={28} />
            </div>
            <h3 className="font-semibold text-brand-300 mb-1">No rides nearby</h3>
            <p className="text-sm text-brand-500">No active trips within 2.5 km of you</p>
          </div>
        )}

        {userLocation && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((trip, i) => {
              const isConnected = connectedIds.has(trip._id);
              const isConnecting = connecting === trip._id;
              const fare = trip.estimatedFare ? Math.ceil(trip.estimatedFare / (trip.seats || 1)) : null;
              return (
                <motion.div key={trip._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.2) }}
                  className="bg-brand-900 rounded-2xl border border-brand-800 p-4 hover:border-brand-700 hover:shadow-lg hover:shadow-black/30 transition-all">

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-accent-500 to-accent-400 rounded-full flex items-center justify-center text-brand-900 font-bold flex-shrink-0 overflow-hidden">
                      {trip.user?.profilePhoto ? <img src={trip.user.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" /> : trip.user?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white text-sm">{trip.user?.name}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          trip.user?.role === 'driver'
                            ? 'bg-accent-400/15 text-accent-400'
                            : 'bg-blue-500/15 text-blue-400'
                        }`}>
                          {trip.user?.role === 'driver' ? '🧑‍✈️ Driver' : '🧑‍💼 Rider'}
                        </span>
                        {trip.user?.isVerified && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-brand-400 mt-0.5">
                        <FiStar className="text-accent-400 fill-accent-400" size={11} />
                        <span>{trip.user?.rating || '5.0'}</span>
                        <span>·</span>
                        <span>{VEHICLE_ICONS[trip.vehicleType]} {trip.vehicleType}</span>
                        <span>·</span>
                        <span>{new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                    {fare && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-bold text-accent-400">₹{fare}</div>
                        <div className="text-xs text-brand-500">per person</div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mb-3 bg-brand-800 rounded-xl p-3">
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                      <div className="w-0.5 h-5 bg-brand-600 border-dashed" />
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-medium text-brand-200 truncate">{trip.source?.landmark || trip.source?.address?.split(',').slice(0, 2).join(',')}</p>
                      <p className="text-[10px] text-brand-500 truncate">{trip.source?.area || ''}</p>
                      <p className="text-xs text-brand-400 truncate">{trip.destination?.landmark || trip.destination?.address?.split(',').slice(0, 2).join(',')}</p>
                      <p className="text-[10px] text-brand-500 truncate">{trip.destination?.area || ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-brand-500">
                      <span className="flex items-center gap-1"><FiClock size={11} />{trip.time}</span>
                      <span className="flex items-center gap-1"><FiUsers size={11} />{trip.availableSeats} seats</span>
                    </div>
                    <button onClick={() => handleConnect(trip)} disabled={isConnected || isConnecting}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60 ${
                        isConnected
                          ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                          : 'bg-accent-400 text-brand-900 shadow-sm shadow-accent-400/20'
                      }`}>
                      {isConnecting ? <div className="w-4 h-4 border-2 border-brand-900/40 border-t-brand-900 rounded-full animate-spin" />
                        : isConnected ? <><FiCheck size={13} /> Sent</> : <><FiNavigation size={13} /> Connect</>}
                    </button>
                  </div>

                  {trip.notes && <p className="mt-2 text-xs text-brand-500 italic truncate">"{trip.notes}"</p>}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
      <DriverBottomNav />
    </div>
  );
}
