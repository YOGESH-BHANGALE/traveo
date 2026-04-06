'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiNavigation, FiZap, FiDollarSign, FiUser } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

const driverNavItems = [
  { href: '/driver/dashboard',    icon: FiHome,       label: 'Home' },
  { href: '/driver/rides',        icon: FiNavigation, label: 'Rides' },
  { href: '/driver/auto-session', icon: FiZap,        label: 'Drive', primary: true },
  { href: '/driver/earnings',     icon: FiDollarSign, label: 'Earnings' },
  { href: '/driver/profile',      icon: FiUser,       label: 'Profile' },
];

export default function DriverBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, user, loading } = useAuth();
  // Only show to authenticated drivers, and not while loading
  if (!isAuthenticated || loading || user?.role !== 'driver') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="bg-brand-900 border-t border-brand-800">
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {driverNavItems.map(({ href, icon: Icon, label, primary }) => {
            const active = pathname === href || pathname.startsWith(href + '/');

            if (primary) {
              return (
                <Link key={href} href={href}
                  className="relative -top-5 flex flex-col items-center select-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}>
                  <div className="w-14 h-14 bg-accent-400 rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-transform duration-100">
                    <Icon size={26} className="text-brand-900" />
                  </div>
                  <span className="text-[10px] font-bold text-accent-400 mt-1">{label}</span>
                </Link>
              );
            }

            return (
              <Link key={href} href={href}
                className="flex flex-col items-center justify-center min-w-[56px] py-1 select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}>
                <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors duration-150 ${active ? 'bg-accent-400/15' : ''}`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8}
                    className={`transition-colors duration-150 ${active ? 'text-accent-400' : 'text-brand-500'}`} />
                </div>
                <span className={`text-[10px] mt-0.5 font-semibold transition-colors duration-150 ${active ? 'text-accent-400' : 'text-brand-500'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
