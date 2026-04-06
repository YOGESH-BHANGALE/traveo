'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiNavigation, FiArrowLeft, FiStar, FiUsers,
  FiClock, FiZap, FiMapPin, FiAlertTriangle, FiCalendar
} from 'react-icons/fi';
import BottomNav from '@/components/BottomNav';
import DriverBottomNav from '@/components/DriverBottomNav';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { autoAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

function BoardingTimer({ deadline }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(deadline) - Date.now()) / 1000));
      setRemaining(diff);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const urgent = remaining < 60;

  return (
    <span className={`font-mono font-bold text-sm ${urgent ? 'text-red-400 animate-pulse' : 'text-accent-400'}`}>
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

export default function AutoSharePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { socket } = useSocket();
  const [autos, setAutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAuto, setSelectedAuto] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const watchRef = useRef(null);
  const locationRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!isAuthenticated) return;

    if (!navigator.geolocation) { toast.error('Geolocation not supported'); setLoading(false); return; }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        locationRef.current = loc;
        fetchNearby(loc);
      },
      () => { setLoading(false); toast.error('Location access denied'); },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, [isAuthenticated, authLoading]);

  const fetchDebounce = useRef(null);
  const fetchNearby = (loc) => {
    clearTimeout(fetchDebounce.current);
    fetchDebounce.current = setTimeout(async () => {
      try {
        const res = await autoAPI.getNearby({ lat: loc.lat, lng: loc.lng, radius: 3000 });
        setAutos(res.data.autos || []);
      } catch (_) {}
      finally { setLoading(false); }
    }, 2000);
  };

  // Real-time: new auto comes online
  useEffect(() => {
    if (!socket) return;
    const handleAutoOnline = ({ auto }) => {
      const loc = locationRef.current;
      if (!loc) return;
      setAutos((prev) => {
        if (prev.some((a) => a._id === auto._id)) return prev;
        toast(`🛺 New auto nearby from ${auto.driver?.name?.split(' ')[0]}!`);
        return [auto, ...prev];
      });
    };
    const handleAutoOffline = ({ autoId }) => {
      setAutos((prev) => prev.filter((a) => a._id !== autoId));
    };
    const handleSeatUpdate = ({ autoId, availableSeats }) => {
      setAutos((prev) => prev.map((a) => a._id === autoId ? { ...a, availableSeats } : a));
    };
    socket.on('auto_online', handleAutoOnline);
    socket.on('auto_offline', handleAutoOffline);
    socket.on('seat_map_update', handleSeatUpdate);
    return () => {
      socket.off('auto_online', handleAutoOnline);
      socket.off('auto_offline', handleAutoOffline);
      socket.off('seat_map_update', handleSeatUpdate);
    };
  }, [socket]);

  if (authLoading || loading) return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-brand-400 text-sm">Finding nearby autos...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      {/* Header */}
      <div className="bg-brand-900 border-b border-brand-800 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/home')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 text-brand-300">
            <FiArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">AutoShare</h1>
            <p className="text-xs text-brand-400 flex items-center gap-1">
              {userLocation
                ? <><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Live · {autos.length} auto{autos.length !== 1 ? 's' : ''} nearby</>
                : 'Getting location...'}
            </p>
          </div>
          <button onClick={() => setShowMap((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${showMap ? 'border-accent-400 bg-accent-400/10 text-accent-400' : 'border-brand-700 text-brand-400'}`}>
            🗺 Map
          </button>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-28">
        <AnimatePresence>
          {showMap && userLocation && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4 rounded-2xl">
              <MapComponent userLocation={userLocation} nearbyTrips={[]} height="240px" />
            </motion.div>
          )}
        </AnimatePresence>

        {!userLocation && (
          <div className="bg-brand-900 rounded-2xl border border-dashed border-amber-700/50 py-10 text-center mb-4">
            <FiNavigation className="text-amber-400 mx-auto mb-2" size={28} />
            <p className="text-sm text-amber-300 font-medium">Location access required</p>
          </div>
        )}

        {userLocation && autos.length === 0 && (
          <div className="bg-brand-900 rounded-2xl border border-dashed border-brand-700 py-14 text-center">
            <div className="text-4xl mb-3">🛺</div>
            <h3 className="font-semibold text-brand-300 mb-1">No autos nearby</h3>
            <p className="text-sm text-brand-500">No active autos within 3 km right now</p>
            <button onClick={() => router.push('/trips/new')}
              className="mt-4 inline-flex items-center gap-1.5 bg-accent-400 text-brand-900 text-sm font-bold px-4 py-2.5 rounded-xl">
              <FiCalendar size={14} /> Schedule Instead
            </button>
          </div>
        )}

        <div className="space-y-3">
          {autos.map((auto, i) => (
            <motion.div key={auto._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-brand-900 rounded-2xl border border-brand-800 p-4 hover:border-brand-700 transition-all">

              {/* Driver info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-accent-500 to-accent-400 rounded-full flex items-center justify-center text-brand-900 font-bold overflow-hidden flex-shrink-0">
                  {auto.driver?.profilePhoto
                    ? <img src={auto.driver.profilePhoto} alt="" className="w-full h-full object-cover" />
                    : auto.driver?.name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{auto.driver?.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-brand-400">
                    <FiStar className="text-accent-400 fill-accent-400" size={10} />
                    <span>{auto.driver?.rating || '5.0'}</span>
                    {auto.vehicleNumber && <><span>·</span><span>{auto.vehicleNumber}</span></>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-black text-accent-400">₹{auto.farePerSeat}</div>
                  <div className="text-xs text-brand-500">per seat</div>
                </div>
              </div>

              {/* Route */}
              <div className="flex gap-3 bg-brand-800 rounded-xl p-3 mb-3">
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  <div className="w-0.5 h-5 bg-brand-600" />
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-medium text-brand-200 truncate">{auto.route.source.address || `${auto.route.source.lat.toFixed(4)}, ${auto.route.source.lng.toFixed(4)}`}</p>
                  <p className="text-xs text-brand-400 truncate">{auto.route.destination.address || `${auto.route.destination.lat.toFixed(4)}, ${auto.route.destination.lng.toFixed(4)}`}</p>
                </div>
              </div>

              {/* Seats + timer */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 text-xs text-brand-400">
                  <span className="flex items-center gap-1">
                    <FiUsers size={11} />
                    <span className={auto.availableSeats === 0 ? 'text-red-400' : 'text-green-400'}>
                      {auto.availableSeats} seat{auto.availableSeats !== 1 ? 's' : ''} left
                    </span>
                  </span>
                  {auto.boardingDeadline && (
                    <span className="flex items-center gap-1">
                      <FiClock size={11} />
                      <BoardingTimer deadline={auto.boardingDeadline} />
                    </span>
                  )}
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                  auto.status === 'online' ? 'bg-green-500/10 text-green-400' : 'bg-accent-400/10 text-accent-400'
                }`}>
                  {auto.status === 'online' ? '🟢 Online' : '🟡 Boarding'}
                </span>
              </div>

              {/* Book button */}
              <button
                onClick={() => router.push(`/autoshare/${auto._id}`)}
                disabled={auto.availableSeats === 0}
                className="w-full flex items-center justify-center gap-2 bg-accent-400 text-brand-900 font-bold py-3 rounded-xl text-sm disabled:opacity-50 active:scale-95 transition-all"
              >
                <FiZap size={15} /> Book Seat Instantly
              </button>
            </motion.div>
          ))}
        </div>
      </main>
      <BottomNav />
      <DriverBottomNav />
    </div>
  );
}
