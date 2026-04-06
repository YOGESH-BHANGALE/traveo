'use client';

import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';

// Lazy load non-critical components so they don't block initial render
const Chatbot = dynamic(() => import('@/components/Chatbot'), { ssr: false });
const InstallPrompt = dynamic(() => import('@/components/InstallPrompt'), { ssr: false });

const toastOptions = {
  duration: 3000,
  style: {
    background: '#1a1a1a',
    color: '#fff',
    borderRadius: '12px',
    padding: '14px 16px',
    border: '1px solid #2a2a2a',
    fontSize: '14px',
  },
  success: { iconTheme: { primary: '#fbbf24', secondary: '#1a1a1a' } },
  error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
};

export default function ClientProviders({ children }) {
  return (
    <AuthProvider>
      <SocketProvider>
        {children}
        <Chatbot />
        <InstallPrompt />
        <Toaster position="top-center" toastOptions={toastOptions} />
      </SocketProvider>
    </AuthProvider>
  );
}
