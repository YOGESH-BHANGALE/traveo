'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiZap, FiClock } from 'react-icons/fi';
import { autoAPI } from '@/lib/api';

/**
 * AutoSuggestionPopup
 * Shows when user is on the planned ride form and a live auto exists on their route.
 * Props: userLat, userLng — current user location
 */
export default function AutoSuggestionPopup({ userLat, userLng }) {
  const router = useRouter();
  const [suggestion, setSuggestion] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userLat || !userLng || dismissed) return;
    const check = async () => {
      try {
        const res = await autoAPI.getNearby({ lat: userLat, lng: userLng, radius: 2000 });
        const autos = res.data.autos || [];
        if (autos.length > 0) setSuggestion(autos[0]);
      } catch (_) {}
    };
    check();
    const id = setInterval(check, 30000); // re-check every 30s
    return () => clearInterval(id);
  }, [userLat, userLng, dismissed]);

  const getMinutesLeft = (deadline) => {
    if (!deadline) return null;
    const diff = Math.max(0, Math.floor((new Date(deadline) - Date.now()) / 60000));
    return diff;
  };

  const mins = suggestion?.boardingDeadline ? getMinutesLeft(suggestion.boardingDeadline) : null;

  return (
    <AnimatePresence>
      {suggestion && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 left-4 right-4 z-50 max-w-lg mx-auto"
        >
          <div className="bg-brand-800 border border-accent-400/30 rounded-2xl p-4 shadow-2xl shadow-black/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent-400/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiZap size={20} className="text-accent-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Auto available on your route!</p>
                <p className="text-xs text-brand-400 mt-0.5">
                  {suggestion.driver?.name?.split(' ')[0]}'s auto
                  {mins !== null ? ` · leaving in ${mins} min` : ''}
                  {' '}· ₹{suggestion.farePerSeat}/seat · {suggestion.availableSeats} seats left
                </p>
              </div>
              <button onClick={() => setDismissed(true)} className="text-brand-500 hover:text-brand-300 flex-shrink-0">
                <FiX size={18} />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => router.push(`/autoshare/${suggestion._id}`)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-accent-400 text-brand-900 font-bold py-2.5 rounded-xl text-sm"
              >
                <FiZap size={13} /> Book Now
              </button>
              <button onClick={() => setDismissed(true)}
                className="px-4 bg-brand-700 text-brand-300 font-semibold py-2.5 rounded-xl text-sm border border-brand-600">
                Ignore
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
