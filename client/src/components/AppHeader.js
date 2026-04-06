'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiHome } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function AppHeader({ title, subtitle, backHref, showHome = true, right }) {
  const router = useRouter();
  const handleBack = () => backHref ? router.push(backHref) : router.push('/dashboard');

  return (
    <div className="bg-brand-900 border-b border-brand-800 sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          onClick={handleBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 hover:bg-brand-700 text-brand-300 transition-colors flex-shrink-0"
          aria-label="Go back"
        >
          <FiArrowLeft size={18} />
        </motion.button>

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black text-white truncate">{title}</h1>
          {subtitle && <p className="text-xs text-brand-400 truncate">{subtitle}</p>}
        </div>

        {right ? right : showHome && (
          <motion.div whileTap={{ scale: 0.85 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 hover:bg-brand-700 text-brand-400 transition-colors flex-shrink-0"
              aria-label="Home"
            >
              <FiHome size={16} />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
