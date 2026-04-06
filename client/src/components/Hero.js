'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiSearch, FiNavigation, FiShield, FiUsers } from 'react-icons/fi';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center space-x-2 bg-primary-100 text-primary-700 rounded-full px-4 py-2 text-sm font-medium mb-6">
              <FiShield size={16} />
              <span>Safe & Verified Travel Companions</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Going the Same Way?{' '}
              <span className="gradient-text">Travel Together.</span>
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg">
              Connect with fellow travelers heading to the same destination. Share rides,
              split costs, reduce traffic, and make your commute more enjoyable and
              eco-friendly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/dashboard" className="btn-primary text-base px-8 py-4">
                <FiSearch className="mr-2" />
                Find Travel Buddy
              </Link>
              <Link href="/trips/new" className="btn-secondary text-base px-8 py-4">
                <FiNavigation className="mr-2" />
                Post a Trip
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-8">
              <div>
                <div className="text-2xl font-bold text-gray-900">10K+</div>
                <div className="text-sm text-gray-500">Active Users</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <div className="text-2xl font-bold text-gray-900">50K+</div>
                <div className="text-sm text-gray-500">Rides Shared</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <div className="text-2xl font-bold text-gray-900">30%</div>
                <div className="text-sm text-gray-500">Avg. Savings</div>
              </div>
            </div>
          </motion.div>

          {/* Right - Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="glass-card p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Find Your Travel Buddy</h3>
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <FiUsers className="text-primary-600" />
                  </div>
                </div>

                {/* Mock Search */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-600">DR.D.Y.Patil Institute, Pimpri</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-sm text-gray-600">Pune Railway Station</span>
                  </div>
                </div>

                {/* Mock Results */}
                <div className="space-y-3">
                  {[
                    { name: 'Rahul S.', time: '8:30 AM', seats: 2, score: 95 },
                    { name: 'Priya M.', time: '8:45 AM', seats: 3, score: 87 },
                    { name: 'Amit K.', time: '9:00 AM', seats: 1, score: 82 },
                  ].map((match, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.15 }}
                      className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {match.name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{match.name}</div>
                          <div className="text-xs text-gray-500">{match.time} &middot; {match.seats} seats</div>
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
                        {match.score}% match
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-200/50 rounded-2xl -z-10 rotate-12" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-accent-200/50 rounded-2xl -z-10 -rotate-12" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
