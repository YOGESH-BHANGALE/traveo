'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiCalendar, FiClock, FiUsers, FiFileText,
  FiArrowRight, FiDollarSign
} from 'react-icons/fi';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import DriverBottomNav from '@/components/DriverBottomNav';
import LocationInput from '@/components/LocationInput';
import AutoSuggestionPopup from '@/components/AutoSuggestionPopup';
import { useAuth } from '@/context/AuthContext';
import { tripsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const VEHICLE_OPTIONS = [
  { value: 'auto', label: 'Auto', emoji: '🛺' },
  { value: 'car', label: 'Car', emoji: '🚗' },
  { value: 'bike', label: 'Bike', emoji: '🏍️' },
  { value: 'any', label: 'Any', emoji: '🚐' },
];

export default function NewTripPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [formData, setFormData] = useState({
    source: null, destination: null, date: '', time: '',
    seats: 1, vehicleType: 'auto', estimatedFare: '', notes: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
    // Get user location for smart suggestion
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, [isAuthenticated, authLoading, router]);

  const set = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.source || !formData.destination) { toast.error('Please select pickup and destination'); return; }
    if (!formData.source.lat || !formData.source.lng) { toast.error('Pickup location coordinates missing. Please reselect.'); return; }
    if (!formData.destination.lat || !formData.destination.lng) { toast.error('Destination coordinates missing. Please reselect.'); return; }
    if (!formData.date || !formData.time) { toast.error('Please select date and time'); return; }
    // Validate not in the past
    const tripDateTime = new Date(`${formData.date}T${formData.time}`);
    if (tripDateTime < new Date()) { toast.error('Trip date and time cannot be in the past'); return; }
    setLoading(true);
    try {
      const res = await tripsAPI.create({
        source: formData.source, destination: formData.destination,
        date: formData.date, time: formData.time, seats: formData.seats,
        vehicleType: formData.vehicleType,
        estimatedFare: formData.estimatedFare ? Number(formData.estimatedFare) : undefined,
        notes: formData.notes,
      });
      if (user?.role === 'driver') {
        toast.success('Trip posted! Visible to riders only.', { duration: 4000, icon: '🧑‍✈️' });
      } else {
        toast.success('Trip posted! Finding matches...', { duration: 3000 });
      }
      router.push(`/matches?tripId=${res.data.trip._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post trip');
    } finally { setLoading(false); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      <AppHeader
        title="Post a Ride"
        subtitle="Share your trip and split the fare"
        backHref={user?.role === 'driver' ? '/driver/dashboard' : '/dashboard'}
      />
      <main className="pb-28 max-w-lg mx-auto px-4 pt-4">
        <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          onSubmit={handleSubmit} className="space-y-4">

          {/* Driver visibility notice */}
          {user?.role === 'driver' && (
            <div className="bg-accent-400/10 border border-accent-400/30 rounded-2xl px-4 py-3 flex items-start gap-3">
              <span className="text-xl mt-0.5">🧑‍✈️</span>
              <div>
                <p className="text-sm font-bold text-accent-400">Driver Trip</p>
                <p className="text-xs text-brand-400 mt-0.5">Your trip will only be visible to riders, not other drivers.</p>
              </div>
            </div>
          )}

          {/* Route Card */}
          <div className="bg-brand-900 rounded-2xl border border-brand-800 p-5 space-y-4">
            <h2 className="text-xs font-semibold text-brand-400 uppercase tracking-wide">Route</h2>
            <LocationInput label="Pickup Location" placeholder="Where are you starting from?"
              value={formData.source} onChange={(loc) => set('source', loc)}
              showCurrentLocation={true} city={user?.city || ''} />
            <LocationInput label="Destination" placeholder="Where are you going?"
              value={formData.destination} onChange={(loc) => set('destination', loc)} city={user?.city || ''} />
          </div>

          {/* Date & Time */}
          <div className="bg-brand-900 rounded-2xl border border-brand-800 p-5">
            <h2 className="text-xs font-semibold text-brand-400 uppercase tracking-wide mb-4">When</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-brand-300 mb-1">Date</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={16} />
                  <input type="date" required className="input-field pl-9 text-sm"
                    min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={(e) => set('date', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-300 mb-1">Time</label>
                <div className="relative">
                  <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={16} />
                  <input type="time" required className="input-field pl-9 text-sm"
                    value={formData.time} onChange={(e) => set('time', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="bg-brand-900 rounded-2xl border border-brand-800 p-5">
            <h2 className="text-xs font-semibold text-brand-400 uppercase tracking-wide mb-3">Vehicle Type</h2>
            <div className="grid grid-cols-4 gap-2">
              {VEHICLE_OPTIONS.map((v) => (
                <button key={v.value} type="button" onClick={() => set('vehicleType', v.value)}
                  className={`flex flex-col items-center py-2.5 px-1 rounded-xl border-2 transition-all ${
                    formData.vehicleType === v.value
                      ? 'border-accent-400 bg-accent-400/10'
                      : 'border-brand-700 bg-brand-800 hover:border-brand-600'
                  }`}>
                  <span className="text-xl mb-1">{v.emoji}</span>
                  <span className={`text-[10px] font-medium ${formData.vehicleType === v.value ? 'text-accent-400' : 'text-brand-500'}`}>{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fare & Seats */}
          <div className="bg-brand-900 rounded-2xl border border-brand-800 p-5">
            <h2 className="text-xs font-semibold text-brand-400 uppercase tracking-wide mb-4">Fare & Seats</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-brand-300 mb-1">Total Fare (₹)</label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={16} />
                  <input type="number" min="0" className="input-field pl-9 text-sm" placeholder="e.g. 200"
                    value={formData.estimatedFare} onChange={(e) => set('estimatedFare', e.target.value)} />
                </div>
                {formData.estimatedFare > 0 && (
                  <p className="text-xs text-accent-400 mt-1">≈ ₹{Math.ceil(formData.estimatedFare / formData.seats)} per person</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-300 mb-1">Seats to Share</label>
                <div className="relative">
                  <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={16} />
                  <select className="input-field pl-9 text-sm appearance-none"
                    value={formData.seats} onChange={(e) => set('seats', parseInt(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-brand-900 rounded-2xl border border-brand-800 p-5">
            <label className="block text-sm font-medium text-brand-300 mb-2">
              <FiFileText className="inline mr-1.5 text-brand-500" size={15} />
              Notes <span className="text-brand-500 font-normal">(optional)</span>
            </label>
            <textarea className="input-field resize-none text-sm" rows={3}
              placeholder="Any preferences, pickup details, or notes for your travel buddy..."
              value={formData.notes} onChange={(e) => set('notes', e.target.value)} maxLength={500} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-brand-900/40 border-t-brand-900 rounded-full animate-spin" />
                Posting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Post Trip & Find Matches <FiArrowRight size={18} />
              </span>
            )}
          </button>
        </motion.form>
      </main>
      <BottomNav />
      <DriverBottomNav />
      {userLocation && <AutoSuggestionPopup userLat={userLocation.lat} userLng={userLocation.lng} />}
    </div>
  );
}
