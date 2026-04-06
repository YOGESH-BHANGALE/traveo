'use client';

import { motion } from 'framer-motion';
import { FiMapPin, FiUsers, FiCheck, FiNavigation } from 'react-icons/fi';

const steps = [
  {
    icon: FiMapPin,
    title: 'Post Your Trip',
    description: 'Enter your source, destination, date, and time. We handle the rest.',
    color: 'from-green-400 to-emerald-500',
  },
  {
    icon: FiUsers,
    title: 'Get Matched',
    description: 'Our smart algorithm finds travelers going the same way at similar times.',
    color: 'from-blue-400 to-indigo-500',
  },
  {
    icon: FiCheck,
    title: 'Accept & Connect',
    description: 'Review matches, chat with your travel buddy, and confirm the ride.',
    color: 'from-purple-400 to-pink-500',
  },
  {
    icon: FiNavigation,
    title: 'Travel Together',
    description: 'Share the ride, split costs, and enjoy a safer, greener commute.',
    color: 'from-orange-400 to-red-500',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="section-heading mb-4">
            How <span className="gradient-text">Traveo</span> Works
          </h2>
          <p className="section-subheading">
            Four simple steps to find your perfect travel companion and share your ride.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="card hover:shadow-xl transition-shadow duration-300 text-center h-full">
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                  <step.icon className="text-white" size={24} />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-gray-200" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
