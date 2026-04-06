'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiTruck } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const [role, setRole] = useState(searchParams.get('role') || null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    vehicleNumber: '', vehicleModel: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (formData.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const payload = {
        name: formData.name, email: formData.email,
        password: formData.password, phone: formData.phone,
        role: role || 'user',
      };
      if (role === 'driver') {
        payload.vehicleNumber = formData.vehicleNumber;
        payload.vehicleModel = formData.vehicleModel;
      }
      
      console.log('Registration payload:', { ...payload, password: '[HIDDEN]' });
      const userData = await register(payload);
      console.log('Registration successful - User data:', userData);
      console.log('User role from backend:', userData?.role);
      
      toast.success('Account created!');
      
      // Use window.location.href for more reliable redirect (forces full page load)
      if (userData?.role === 'driver') {
        console.log('Redirecting new driver to /driver/dashboard');
        window.location.href = '/driver/dashboard';
      } else {
        console.log('Redirecting new rider to /dashboard');
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleGoogleSignup = () => {
    if (!role) {
      toast.error('Please select a role first');
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    // Pass role as state parameter to OAuth flow
    window.location.href = `${apiUrl}/api/auth/google?state=${role}`;
  };

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-950 px-4 py-10 page-enter">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src="/traveo-icon.svg" alt="Traveo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-black text-white">Traveo</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">Create Account</h1>
          <p className="text-brand-400 text-sm">Join the smart travel community</p>
        </div>

        {/* Role selector */}
        {!role ? (
          <div className="space-y-3">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setRole('user')}
              className="w-full bg-brand-900 border-2 border-brand-700 hover:border-accent-400 rounded-2xl p-5 text-left transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-accent-400/10 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-accent-400/20 transition-colors">
                  🧑‍💼
                </div>
                <div>
                  <p className="font-black text-white text-lg">Sign up as Rider</p>
                  <p className="text-sm text-brand-400 mt-0.5">Find trips, connect with travelers, split fares</p>
                </div>
              </div>
            </motion.button>

            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setRole('driver')}
              className="w-full bg-brand-900 border-2 border-brand-700 hover:border-accent-400 rounded-2xl p-5 text-left transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-accent-400/10 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-accent-400/20 transition-colors">
                  🧑‍✈️
                </div>
                <div>
                  <p className="font-black text-white text-lg">Sign up as Driver</p>
                  <p className="text-sm text-brand-400 mt-0.5">Post routes, manage auto sessions, earn money</p>
                </div>
              </div>
            </motion.button>

            <p className="text-center text-sm text-brand-500 pt-2">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-accent-400 font-medium hover:text-accent-300">Log In</Link>
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={role} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}>

              {/* Role badge + back */}
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setRole(null)}
                  className="text-xs text-brand-400 hover:text-white flex items-center gap-1 transition-colors">
                  ← Back
                </button>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  role === 'driver' ? 'bg-accent-400/10 text-accent-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {role === 'driver' ? '🧑‍✈️ Driver Sign Up' : '🧑‍💼 Rider Sign Up'}
                </span>
              </div>

              <div className="bg-brand-900 rounded-2xl border border-brand-800 p-6">
                {/* Google */}
                <button onClick={handleGoogleSignup}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-brand-700 bg-brand-800 rounded-xl hover:bg-brand-700 transition-colors mb-5">
                  <GoogleIcon />
                  <span className="text-sm font-medium text-brand-200">Continue with Google</span>
                </button>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-700" /></div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-brand-900 text-brand-500">or</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-300 mb-1">Full Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
                      <input type="text" required className="input-field pl-10" placeholder="John Doe"
                        value={formData.name} onChange={set('name')} autoComplete="name" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-300 mb-1">Email</label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
                      <input type="email" required className="input-field pl-10" placeholder="you@example.com"
                        value={formData.email} onChange={set('email')} autoComplete="email" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-300 mb-1">Phone</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
                      <input type="tel" className="input-field pl-10" placeholder="+91 98765 43210"
                        value={formData.phone} onChange={set('phone')} autoComplete="tel" />
                    </div>
                  </div>

                  {/* Driver-only fields */}
                  {role === 'driver' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 overflow-hidden">
                      <div className="bg-accent-400/5 border border-accent-400/20 rounded-xl p-3">
                        <p className="text-xs font-semibold text-accent-400 mb-3 flex items-center gap-1.5">
                          <FiTruck size={12} /> Vehicle Details
                        </p>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-brand-300 mb-1">Vehicle Number</label>
                            <input type="text" className="input-field text-sm" placeholder="MH12AB1234"
                              value={formData.vehicleNumber} onChange={set('vehicleNumber')} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-brand-300 mb-1">Vehicle Model</label>
                            <input type="text" className="input-field text-sm" placeholder="Bajaj RE Auto / Honda City"
                              value={formData.vehicleModel} onChange={set('vehicleModel')} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-brand-300 mb-1">Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
                      <input type={showPassword ? 'text' : 'password'} required minLength={6}
                        className="input-field pl-10 pr-10" placeholder="Min. 6 characters"
                        value={formData.password} onChange={set('password')} autoComplete="new-password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500 hover:text-brand-300">
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-300 mb-1">Confirm Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
                      <input type="password" required className="input-field pl-10" placeholder="Confirm your password"
                        value={formData.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                    {loading ? 'Creating Account...' : `Create ${role === 'driver' ? 'Driver' : 'Rider'} Account`}
                  </button>
                </form>

                <p className="text-center text-sm text-brand-500 mt-5">
                  Already have an account?{' '}
                  <Link href={`/auth/login?role=${role}`} className="text-accent-400 font-medium hover:text-accent-300">Log In</Link>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-950 flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}
