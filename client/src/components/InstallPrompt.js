'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiSmartphone } from 'react-icons/fi';

const STORAGE_KEY = 'traveo_pwa_dismissed';
const DISMISS_DAYS = 7; // re-show after 7 days if not installed

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already installed as standalone — never show
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone) return; // iOS standalone

    // Check if user dismissed recently
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    const ua = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome/.test(ua);

    if (ios && isSafari) {
      setIsIOS(true);
      // Delay slightly so it doesn't pop up immediately on page load
      setTimeout(() => setShow(true), 3000);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 2000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setShow(false);
        return;
      }
    }
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80"
        >
          <div className="bg-brand-800 border border-brand-700 rounded-2xl shadow-2xl shadow-black/50 p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-accent-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <FiSmartphone className="text-brand-900" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Install Traveo</p>
              {isIOS ? (
                <p className="text-xs text-brand-400 mt-0.5">
                  Tap <span className="text-accent-400 font-semibold">Share</span> → <span className="text-accent-400 font-semibold">Add to Home Screen</span>
                </p>
              ) : (
                <p className="text-xs text-brand-400 mt-0.5">Install for faster access — works offline too</p>
              )}
              {!isIOS && (
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={handleInstall}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-accent-400 text-brand-900 text-xs font-bold rounded-lg"
                >
                  <FiDownload size={12} /> Install App
                </motion.button>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleDismiss}
              className="text-brand-500 hover:text-brand-300 flex-shrink-0 transition-colors"
              aria-label="Dismiss"
            >
              <FiX size={18} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
