'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Authentication failed. Please try again.');
        router.push('/auth/login');
        return;
      }

      if (token) {
        try {
          const userData = await loginWithToken(token);
          toast.success('Welcome to Traveo!');
          // Use window.location.href for more reliable redirect
          if (userData?.role === 'driver') {
            window.location.href = '/driver/dashboard';
          } else {
            window.location.href = '/dashboard';
          }
        } catch (err) {
          toast.error('Failed to authenticate. Please try again.');
          router.push('/auth/login');
        }
      } else {
        router.push('/auth/login');
      }
    };

    handleCallback();
  }, [searchParams, loginWithToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-brand-400">Authenticating...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-950">
          <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
