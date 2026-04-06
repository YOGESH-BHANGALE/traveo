'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiUser, FiLogOut, FiMap, FiNavigation, FiMessageSquare } from 'react-icons/fi';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const navLinks = isAuthenticated
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: FiMap },
        { href: '/trips/new', label: 'Post Trip', icon: FiNavigation },
        { href: '/rides', label: 'My Rides', icon: FiMessageSquare },
      ]
    : [
        { href: '/#how-it-works', label: 'How It Works' },
        { href: '/#benefits', label: 'Benefits' },
        { href: '/#testimonials', label: 'Testimonials' },
        { href: '/#contact', label: 'Contact' },
      ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-900/95 backdrop-blur-lg border-b border-brand-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden">
              <img src="/traveo-icon.svg" alt="Traveo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-black text-white">Traveo</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="px-4 py-2 text-sm font-medium text-brand-400 hover:text-white rounded-lg hover:bg-brand-800 transition-all duration-200">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons / Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-brand-800 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-accent-400/20 flex items-center justify-center overflow-hidden">
                    {user?.profilePhoto && user.profilePhoto !== '' ? (
                      <img src={user.profilePhoto} alt={user.name || 'User'} className="w-full h-full object-cover" />
                    ) : <FiUser className="text-accent-400" size={16} />}
                  </div>
                  <span className="text-sm font-medium text-brand-200">{user?.name?.split(' ')[0] || 'User'}</span>
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 mt-2 w-48 bg-brand-800 rounded-xl shadow-xl border border-brand-700 py-2">
                      <Link href="/profile" onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-brand-200 hover:bg-brand-700 hover:text-white">
                        <FiUser size={16} /><span>Profile</span>
                      </Link>
                      <button onClick={() => { setProfileMenuOpen(false); logout(); }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">
                        <FiLogOut size={16} /><span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="btn-secondary text-sm py-2 px-4">Log In</Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-brand-800 text-brand-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-brand-900 border-b border-brand-800">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-brand-300 hover:text-white hover:bg-brand-800 rounded-lg">
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-brand-300 hover:bg-brand-800 rounded-lg">Profile</Link>
                  <button onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="block w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg">Logout</button>
                </>
              ) : (
                <div className="flex space-x-2 pt-2">
                  <Link href="/auth/login" className="btn-secondary text-sm py-2 flex-1 text-center">Log In</Link>
                  <Link href="/auth/register" className="btn-primary text-sm py-2 flex-1 text-center">Sign Up</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
