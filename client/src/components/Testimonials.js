'use client';

import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';

const testimonials = [
  {
    name: 'Aarav Sharma',
    role: 'Engineering Student, D.Y.Patil',
    avatar: 'AS',
    rating: 5,
    text: 'Traveo has been a game-changer for my daily commute. I save over Rs 2000 every month and have made great friends along the way!',
  },
  {
    name: 'Priya Gupta',
    role: 'MBA Student',
    avatar: 'PG',
    rating: 5,
    text: 'As a woman, safety is my top priority. The verified profiles and rating system on Traveo give me peace of mind during every ride.',
  },
  {
    name: 'Rohit Verma',
    role: 'Software Developer',
    avatar: 'RV',
    rating: 4,
    text: 'The smart matching algorithm is incredible. It consistently finds me travel buddies who are heading the exact same direction at the right time.',
  },
  {
    name: 'Sneha Patel',
    role: 'Daily Commuter',
    avatar: 'SP',
    rating: 5,
    text: 'I used to spend 45 minutes stuck in traffic alone. Now I share rides, split costs, and actually enjoy my commute. Highly recommended!',
  },
  {
    name: 'Karan Mehta',
    role: 'Budget Traveler',
    avatar: 'KM',
    rating: 5,
    text: 'Perfect for weekend trips! I found travel companions for my Mussoorie trip and we split the entire travel cost. Amazing experience!',
  },
  {
    name: 'Ananya Singh',
    role: 'College Student',
    avatar: 'AS',
    rating: 4,
    text: 'The real-time chat feature is super helpful. I can coordinate with my travel buddy before the trip and plan everything seamlessly.',
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="section-heading mb-4">
            What Our <span className="gradient-text">Users</span> Say
          </h2>
          <p className="section-subheading">
            Join thousands of happy travelers who have transformed their daily commute with Traveo.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="card hover:shadow-xl transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    size={16}
                    className={i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* User */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-xs text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
