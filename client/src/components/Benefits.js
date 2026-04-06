'use client';

import { motion } from 'framer-motion';
import { FiDollarSign, FiShield, FiGlobe, FiClock, FiHeart, FiTrendingDown } from 'react-icons/fi';

const benefits = [
  {
    icon: FiDollarSign,
    title: 'Save Money',
    description: 'Split travel costs with fellow travelers and save up to 50% on your daily commute expenses.',
    stat: '50%',
    statLabel: 'Cost Savings',
  },
  {
    icon: FiGlobe,
    title: 'Reduce Carbon Footprint',
    description: 'Fewer vehicles on the road means less pollution. Do your part for a greener planet.',
    stat: '30%',
    statLabel: 'Less Emissions',
  },
  {
    icon: FiShield,
    title: 'Safe Travel',
    description: 'Verified profiles, ratings, and emergency contacts ensure a safe travel experience.',
    stat: '100%',
    statLabel: 'Verified Users',
  },
  {
    icon: FiClock,
    title: 'Save Time',
    description: 'Reduce traffic congestion with shared rides. Less traffic means faster commutes for everyone.',
    stat: '20min',
    statLabel: 'Avg. Time Saved',
  },
  {
    icon: FiHeart,
    title: 'Build Community',
    description: 'Meet like-minded people, make new friends, and build a supportive travel community.',
    stat: '10K+',
    statLabel: 'Happy Users',
  },
  {
    icon: FiTrendingDown,
    title: 'Reduce Traffic',
    description: 'Every shared ride means one less vehicle on the road, reducing congestion for everyone.',
    stat: '40%',
    statLabel: 'Less Congestion',
  },
];

export default function Benefits() {
  return (
    <section id="benefits" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="section-heading mb-4">
            Why Choose <span className="gradient-text">Traveo</span>?
          </h2>
          <p className="section-subheading">
            Experience the benefits of smart, shared transportation that saves money and helps the planet.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="card hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 group-hover:bg-primary-200 rounded-xl flex items-center justify-center transition-colors">
                  <benefit.icon className="text-primary-600" size={22} />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary-600">{benefit.stat}</div>
                  <div className="text-xs text-gray-400">{benefit.statLabel}</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
