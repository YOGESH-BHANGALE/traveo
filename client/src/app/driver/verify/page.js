'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiShield, FiCheck, FiArrowLeft, FiPhone, FiCreditCard, FiFileText } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { driverAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DriverVerifyPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ aadharNumber: '', licenseNumber: '', phone: user?.phone || '' });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!authLoading && user?.role !== 'driver') { router.push('/dashboard'); return; }
    // Already verified — go to dashboard
    if (!authLoading && user?.driverVerification?.verifiedBadge) { router.push('/driver/dashboard'); return; }
  }, [authLoading, isAuthenticated, user]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const formatAadhar = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await driverAPI.verify({
        aadharNumber: form.aadharNumber.replace(/\s/g, ''),
        licenseNumber: form.licenseNumber,
        phone: form.phone,
      });
      updateUser(res.data.user);
      toast.success('Verified! ✅ Badge added to your profile.', { duration: 4000 });
      setTimeout(() => router.push('/driver/dashboard'), 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Try again.');
    } finally { setLoading(false); }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      {/* Header */}
      <div className="bg-brand-900 border-b border-brand-800 px-4 py-3 flex items-center gap-3 max-w-lg mx-auto">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 text-brand-300">
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-base font-bold text-white">Driver Verification</h1>
          <p className="text-xs text-brand-400">Get your Verified badge</p>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 pt-6 pb-16 space-y-5">
        {/* Badge preview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-accent-400/20 to-accent-400/5 border border-accent-400/30 rounded-2xl p-5 text-center">
          <div className="w-16 h-16 bg-accent-400/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FiShield size={32} className="text-accent-400" />
          </div>
          <h2 className="text-lg font-black text-white mb-1">Verified Driver Badge</h2>
          <p className="text-sm text-brand-300 mb-3">Shown on your profile and trip cards. Increases bookings by ~30%.</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {['Aadhar Linked', 'License Verified', 'Mobile Verified'].map((item) => (
              <span key={item} className="flex items-center gap-1 text-xs bg-accent-400/10 text-accent-400 px-2.5 py-1 rounded-full font-medium">
                <FiCheck size={11} /> {item}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Form */}
        <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          onSubmit={handleSubmit} className="space-y-4">

          <div className="bg-brand-900 border border-brand-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-brand-400 uppercase tracking-wide">Identity Details</h3>

            {/* Aadhar */}
            <div>
              <label className="block text-sm font-medium text-brand-300 mb-1.5">Aadhar Number</label>
              <div className="relative">
                <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={17} />
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="XXXX XXXX XXXX"
                  className="input-field pl-10 tracking-widest font-mono"
                  value={form.aadharNumber}
                  onChange={(e) => set('aadharNumber', formatAadhar(e.target.value))}
                  maxLength={14}
                />
              </div>
              <p className="text-xs text-brand-500 mt-1">12-digit Aadhar card number</p>
            </div>

            {/* License */}
            <div>
              <label className="block text-sm font-medium text-brand-300 mb-1.5">Driving License Number</label>
              <div className="relative">
                <FiFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={17} />
                <input
                  type="text"
                  required
                  placeholder="e.g. MH12 20200012345"
                  className="input-field pl-10 uppercase"
                  value={form.licenseNumber}
                  onChange={(e) => set('licenseNumber', e.target.value.toUpperCase())}
                  maxLength={20}
                />
              </div>
              <p className="text-xs text-brand-500 mt-1">As printed on your driving license</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-brand-300 mb-1.5">Mobile Number</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={17} />
                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-brand-400 text-sm font-medium">+91</div>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  placeholder="10-digit mobile number"
                  className="input-field pl-16"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Demo notice */}
          <div className="bg-brand-800 border border-brand-700 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <span className="text-lg mt-0.5">ℹ️</span>
            <p className="text-xs text-brand-400">This is a demo verification. No real ID check is performed. Your badge will be granted instantly after submission.</p>
          </div>

          <button type="submit" disabled={loading || !form.aadharNumber || !form.licenseNumber || !form.phone}
            className="btn-primary w-full py-4 text-base disabled:opacity-50 flex items-center justify-center gap-2">
            {loading
              ? <><div className="w-5 h-5 border-2 border-brand-900/40 border-t-brand-900 rounded-full animate-spin" /> Verifying...</>
              : <><FiShield size={18} /> Get Verified Badge</>}
          </button>
        </motion.form>
      </main>
    </div>
  );
}
