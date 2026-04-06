'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import DriverBottomNav from '@/components/DriverBottomNav';
import { useAuth } from '@/context/AuthContext';
import { driverAPI } from '@/lib/api';

export default function DriverEarningsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!authLoading && user?.role !== 'driver') { router.push('/dashboard'); return; }
    if (isAuthenticated) driverAPI.getDashboard().then((r) => setDashboard(r.data.dashboard)).catch(console.error).finally(() => setLoading(false));
  }, [isAuthenticated, authLoading, user]);

  if (authLoading || loading) return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      <div className="bg-brand-900 border-b border-brand-800 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/driver/dashboard')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 text-brand-300">
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">Earnings</h1>
        </div>
      </div>
      <main className="max-w-lg mx-auto px-4 pt-4 pb-28 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Earned', value: `₹${dashboard?.totalEarnings || 0}`, icon: FiDollarSign, color: 'text-accent-400' },
            { label: 'Auto Earnings', value: `₹${dashboard?.autoEarnings || 0}`, icon: FiTrendingUp, color: 'text-green-400' },
            { label: 'Planned Rides', value: `₹${dashboard?.plannedEarnings || 0}`, icon: FiDollarSign, color: 'text-blue-400' },
            { label: 'Total Trips', value: dashboard?.totalTrips || 0, icon: FiTrendingUp, color: 'text-brand-300' },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-brand-900 border border-brand-800 rounded-2xl p-4">
              <s.icon size={18} className={`${s.color} mb-2`} />
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-brand-500 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </main>
      <DriverBottomNav />
    </div>
  );
}
