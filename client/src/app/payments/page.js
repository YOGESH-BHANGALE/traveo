'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiDollarSign, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import BottomNav from '@/components/BottomNav';
import DriverBottomNav from '@/components/DriverBottomNav';
import { useAuth } from '@/context/AuthContext';
import { paymentAPI } from '@/lib/api';

const STATUS_CONFIG = {
  paid: { label: 'Paid', color: 'text-green-400', bg: 'bg-green-500/10', icon: FiCheckCircle },
  created: { label: 'Pending', color: 'text-accent-400', bg: 'bg-accent-400/10', icon: FiClock },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/10', icon: FiXCircle },
  refunded: { label: 'Refunded', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: FiCheckCircle },
};

export default function PaymentsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (isAuthenticated) fetchPayments();
  }, [isAuthenticated, authLoading]);

  const fetchPayments = async () => {
    try {
      const res = await paymentAPI.getHistory();
      setPayments(res.data.payments || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount / 100, 0);

  if (authLoading || loading) return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      <div className="bg-brand-900 border-b border-brand-800 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => router.push(user?.role === 'driver' ? '/driver/dashboard' : '/dashboard')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 text-brand-300"
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Payments</h1>
            <p className="text-xs text-brand-400">{payments.length} transaction{payments.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-28">
        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-brand-900 rounded-2xl border border-brand-800 p-4 mb-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-400/10 rounded-2xl flex items-center justify-center">
            <FiDollarSign size={22} className="text-accent-400" />
          </div>
          <div>
            <p className="text-xs text-brand-400">Total Spent</p>
            <p className="text-2xl font-black text-accent-400">₹{totalPaid.toFixed(0)}</p>
          </div>
        </motion.div>

        {payments.length === 0 ? (
          <div className="bg-brand-900 rounded-2xl border border-dashed border-brand-700 py-14 text-center">
            <FiDollarSign className="text-brand-600 mx-auto mb-3" size={32} />
            <p className="text-brand-400 text-sm">No payments yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment, i) => {
              const cfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.created;
              const Icon = cfg.icon;
              return (
                <motion.div key={payment._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-brand-900 rounded-2xl border border-brand-800 p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{payment.description || 'Ride Payment'}</p>
                    <p className="text-xs text-brand-500">{new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-black text-white">₹{(payment.amount / 100).toFixed(0)}</p>
                    <p className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</p>
                  </div>
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
