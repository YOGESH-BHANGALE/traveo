'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiCalendar, FiZap, FiNavigation, FiShield } from 'react-icons/fi';
import BottomNav from '@/components/BottomNav';
import DriverBottomNav from '@/components/DriverBottomNav';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, loading]);

  if (loading) return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
    </div>
  );

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      {/* Header */}
      <div className="bg-brand-900 border-b border-brand-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-brand-400">Welcome back 👋</p>
            <h1 className="text-xl font-black text-white">{firstName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src="/traveo-icon.svg" alt="Traveo" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-white text-base">Traveo+</span>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 pt-6 pb-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="text-brand-400 text-sm mb-6 text-center">
          How do you want to travel today?
        </motion.p>

        {/* Dual Mode Buttons */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {/* Schedule a Ride */}
          <motion.button
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/trips/new')}
            className="relative overflow-hidden bg-accent-400 rounded-3xl p-6 text-left shadow-xl shadow-accent-400/20 active:scale-[0.97] transition-transform"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent-300/30 rounded-full" />
            <div className="absolute -right-2 -bottom-6 w-16 h-16 bg-accent-300/20 rounded-full" />
            <div className="w-12 h-12 bg-brand-900/20 rounded-2xl flex items-center justify-center mb-4">
              <FiCalendar size={24} className="text-brand-900" />
            </div>
            <h2 className="text-2xl font-black text-brand-900 mb-1">Schedule a Ride</h2>
            <p className="text-brand-800 text-sm font-medium">Plan ahead · Match with travelers · Split fare</p>
            <div className="mt-4 flex items-center gap-2 text-brand-900/70 text-xs font-semibold">
              <FiNavigation size={12} /> Traveo Mode
            </div>
          </motion.button>

          {/* Ride Now */}
          <motion.button
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/autoshare')}
            className="relative overflow-hidden bg-brand-800 border border-brand-700 rounded-3xl p-6 text-left active:scale-[0.97] transition-transform"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-700/50 rounded-full" />
            <div className="w-12 h-12 bg-brand-700 rounded-2xl flex items-center justify-center mb-4">
              <FiZap size={24} className="text-accent-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Ride Now</h2>
            <p className="text-brand-400 text-sm font-medium">Find nearby autos · Book instantly · Live tracking</p>
            <div className="mt-4 flex items-center gap-2 text-brand-400 text-xs font-semibold">
              <span className="text-accent-400">🛺</span> AutoShare Mode
            </div>
          </motion.button>
        </div>

        {/* Quick stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Trips', value: user?.totalTrips || 0, color: 'text-accent-400' },
            { label: 'Rating', value: user?.rating?.toFixed(1) || '5.0', color: 'text-green-400' },
            { label: 'Saved ₹', value: `${(user?.totalTrips || 0) * 50}`, color: 'text-blue-400' },
          ].map((s) => (
            <div key={s.label} className="bg-brand-800 border border-brand-700 rounded-2xl p-3 text-center">
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-brand-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Safety banner */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="bg-brand-800 border border-brand-700 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiShield size={20} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Safety First</p>
            <p className="text-xs text-brand-400">SOS button available in every ride · Emergency contacts notified instantly</p>
          </div>
        </motion.div>
      </main>
      <BottomNav />
      <DriverBottomNav />
    </div>
  );
}
