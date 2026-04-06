'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiArrowLeft, FiPlay, FiCheckCircle, FiWifiOff,
  FiUsers, FiMapPin, FiNavigation
} from 'react-icons/fi';
import DriverBottomNav from '@/components/DriverBottomNav';
import LocationInput from '@/components/LocationInput';
import SeatMap from '@/components/SeatMap';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { autoAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AutoSessionPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const [activeAuto, setActiveAuto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [form, setForm] = useState({
    source: null, destination: null,
    totalSeats: 3, farePerSeat: 30,
    vehicleNumber: '', vehicleModel: '',
    boardingMinutes: 5,
  });
  const watchRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (isAuthenticated) fetchActive();
  }, [isAuthenticated, authLoading]);

  // Live location broadcast to riders
  useEffect(() => {
    if (!socket || !activeAuto) return;
    socket.emit('join_auto', activeAuto._id);

    watchRef.current = navigator.geolocation?.watchPosition(
      (pos) => {
        socket.emit('driver_location_update', {
          autoId: activeAuto._id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
      socket.emit('leave_auto', activeAuto._id);
    };
  }, [socket, activeAuto]);

  const fetchActive = async () => {
    try {
      const res = await autoAPI.getDriverActive();
      setActiveAuto(res.data.auto);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleStart = async () => {
    if (!form.source || !form.destination) { toast.error('Set source and destination'); return; }
    setActionLoading('start');
    try {
      const res = await autoAPI.start({
        sourceLat: form.source.lat, sourceLng: form.source.lng, sourceAddress: form.source.address,
        destLat: form.destination.lat, destLng: form.destination.lng, destAddress: form.destination.address,
        totalSeats: form.totalSeats, farePerSeat: form.farePerSeat,
        vehicleNumber: form.vehicleNumber, vehicleModel: form.vehicleModel,
        boardingMinutes: form.boardingMinutes,
      });
      setActiveAuto(res.data.auto);
      toast.success('You are now online! 🛺');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to start session'); }
    finally { setActionLoading(null); }
  };

  const handleDepart = async () => {
    setActionLoading('depart');
    try {
      await autoAPI.depart(activeAuto._id);
      setActiveAuto((prev) => ({ ...prev, status: 'in_progress' }));
      toast.success('Departed! Ride in progress 🚀');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const handleComplete = async () => {
    setActionLoading('complete');
    try {
      await autoAPI.complete(activeAuto._id);
      setActiveAuto(null);
      toast.success('Session completed!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const handleOffline = async () => {
    setActionLoading('offline');
    try {
      await autoAPI.goOffline(activeAuto._id);
      setActiveAuto(null);
      toast('Gone offline');
    } catch (err) { toast.error('Failed'); }
    finally { setActionLoading(null); }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
    </div>
  );

  const bookedSeats = activeAuto?.bookings
    ?.filter((b) => b.status !== 'cancelled')
    .map((b) => b.seatNumber) || [];

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      <div className="bg-brand-900 border-b border-brand-800 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/driver/dashboard')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 text-brand-300">
            <FiArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Auto Session</h1>
            <p className="text-xs text-brand-400">{activeAuto ? `${activeAuto.autoCode} · ${activeAuto.status}` : 'Start a new session'}</p>
          </div>
          {activeAuto && (
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
              activeAuto.status === 'in_progress' ? 'bg-accent-400/10 text-accent-400' : 'bg-green-500/10 text-green-400'
            }`}>
              {activeAuto.status === 'in_progress' ? '🚀 Moving' : '🟢 Online'}
            </span>
          )}
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-28 space-y-4">
        {!activeAuto ? (
          /* Setup form */
          <>
            <div className="bg-brand-900 rounded-2xl border border-brand-800 p-4 space-y-4">
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-wide">Route</p>
              <LocationInput label="Pickup / Start" placeholder="Where are you starting?" value={form.source}
                onChange={(loc) => setForm((p) => ({ ...p, source: loc }))} showCurrentLocation />
              <LocationInput label="Destination" placeholder="Where are you going?" value={form.destination}
                onChange={(loc) => setForm((p) => ({ ...p, destination: loc }))} />
            </div>

            <div className="bg-brand-900 rounded-2xl border border-brand-800 p-4 space-y-3">
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-wide">Session Settings</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-brand-400 mb-1 block">Seats Available</label>
                  <select className="input-field text-sm" value={form.totalSeats}
                    onChange={(e) => setForm((p) => ({ ...p, totalSeats: parseInt(e.target.value) }))}>
                    {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} seats</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-brand-400 mb-1 block">Fare per Seat (₹)</label>
                  <input type="number" min="0" className="input-field text-sm" value={form.farePerSeat}
                    onChange={(e) => setForm((p) => ({ ...p, farePerSeat: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="text-xs text-brand-400 mb-1 block">Vehicle Number</label>
                  <input type="text" className="input-field text-sm" placeholder="MH12AB1234" value={form.vehicleNumber}
                    onChange={(e) => setForm((p) => ({ ...p, vehicleNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-brand-400 mb-1 block">Boarding Time (min)</label>
                  <input type="number" min="1" max="30" className="input-field text-sm" value={form.boardingMinutes}
                    onChange={(e) => setForm((p) => ({ ...p, boardingMinutes: parseInt(e.target.value) || 5 }))} />
                </div>
              </div>
            </div>

            <button onClick={handleStart} disabled={actionLoading === 'start'}
              className="w-full flex items-center justify-center gap-2 bg-accent-400 text-brand-900 font-black py-4 rounded-2xl text-base disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-accent-400/20">
              {actionLoading === 'start'
                ? <div className="w-5 h-5 border-2 border-brand-900/40 border-t-brand-900 rounded-full animate-spin" />
                : <><FiNavigation size={18} /> Go Online</>}
            </button>
          </>
        ) : (
          /* Active session management */
          <>
            {/* Seat map */}
            <SeatMap
              totalSeats={activeAuto.totalSeats}
              bookedSeats={bookedSeats}
              selectedSeat={null}
              onSelect={() => {}}
              disabled={true}
              layout="auto"
            />

            {/* Bookings list */}
            {activeAuto.bookings?.filter((b) => b.status !== 'cancelled').length > 0 && (
              <div className="bg-brand-900 rounded-2xl border border-brand-800 p-4">
                <p className="text-xs font-semibold text-brand-400 uppercase tracking-wide mb-3">
                  Passengers ({activeAuto.bookings.filter((b) => b.status !== 'cancelled').length})
                </p>
                <div className="space-y-2">
                  {activeAuto.bookings.filter((b) => b.status !== 'cancelled').map((booking) => (
                    <div key={booking._id} className="flex items-center gap-3 p-2 bg-brand-800 rounded-xl">
                      <div className="w-8 h-8 bg-accent-400/10 rounded-full flex items-center justify-center text-accent-400 font-bold text-sm overflow-hidden">
                        {booking.rider?.profilePhoto
                          ? <img src={booking.rider.profilePhoto} alt="" className="w-full h-full object-cover" />
                          : booking.rider?.name?.[0] || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{booking.rider?.name}</p>
                        <p className="text-xs text-brand-400">Seat {booking.seatNumber}</p>
                      </div>
                      <span className="text-xs text-accent-400 font-bold">₹{booking.fare}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {activeAuto.status !== 'in_progress' && (
                <button onClick={handleDepart} disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-accent-400 text-brand-900 font-black py-3.5 rounded-2xl disabled:opacity-50 active:scale-95 transition-all">
                  {actionLoading === 'depart'
                    ? <div className="w-5 h-5 border-2 border-brand-900/40 border-t-brand-900 rounded-full animate-spin" />
                    : <><FiPlay size={18} /> Depart Now</>}
                </button>
              )}
              {activeAuto.status === 'in_progress' && (
                <button onClick={handleComplete} disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-black py-3.5 rounded-2xl disabled:opacity-50 active:scale-95 transition-all">
                  {actionLoading === 'complete'
                    ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><FiCheckCircle size={18} /> Complete Ride</>}
                </button>
              )}
              <button onClick={handleOffline} disabled={!!actionLoading}
                className="w-full flex items-center justify-center gap-2 bg-brand-800 border border-brand-700 text-brand-300 font-semibold py-3 rounded-2xl text-sm disabled:opacity-50">
                {actionLoading === 'offline'
                  ? <div className="w-4 h-4 border-2 border-brand-600 border-t-brand-300 rounded-full animate-spin" />
                  : <><FiWifiOff size={16} /> Go Offline</>}
              </button>
            </div>
          </>
        )}
      </main>
      <DriverBottomNav />
    </div>
  );
}
