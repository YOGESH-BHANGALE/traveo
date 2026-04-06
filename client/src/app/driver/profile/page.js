'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Driver profile reuses the same profile page
export default function DriverProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  useEffect(() => {
    if (!loading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!loading) router.push('/profile');
  }, [loading, isAuthenticated]);
  return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
    </div>
  );
}
