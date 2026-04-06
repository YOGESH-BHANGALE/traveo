'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
// Driver rides = same as /rides but with driver context
// Reuse the existing rides page logic by redirecting
export default function DriverRidesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  useEffect(() => {
    if (!loading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!loading && user?.role !== 'driver') { router.push('/dashboard'); return; }
    if (!loading) router.push('/rides');
  }, [loading, isAuthenticated, user]);
  return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
    </div>
  );
}
