'use client';

import { motion } from 'framer-motion';
import { FiArrowRight, FiCalendar } from 'react-icons/fi';

const posts = [
  {
    title: '10 Tips for a Safe Shared Ride Experience',
    excerpt: 'Essential safety guidelines every ride-sharing user should follow for a secure and comfortable journey.',
    date: 'Mar 5, 2026',
    category: 'Safety',
    readTime: '5 min read',
    color: 'bg-red-50 text-red-600',
  },
  {
    title: 'How Ride-Sharing Reduces Your Carbon Footprint',
    excerpt: 'Discover how sharing your daily commute can significantly reduce greenhouse gas emissions and help the environment.',
    date: 'Mar 1, 2026',
    category: 'Environment',
    readTime: '4 min read',
    color: 'bg-green-50 text-green-600',
  },
  {
    title: 'Smart Commuting: Save Money with Traveo',
    excerpt: 'A practical guide to maximizing your savings by using intelligent ride-matching for your daily travel needs.',
    date: 'Feb 25, 2026',
    category: 'Finance',
    readTime: '6 min read',
    color: 'bg-blue-50 text-blue-600',
  },
];

export default function Blog() {
  return (
    <section id="blog" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="section-heading mb-4">
            Latest from Our <span className="gradient-text">Blog</span>
          </h2>
          <p className="section-subheading">
            Tips, stories, and insights about smarter, greener commuting.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card hover:shadow-xl transition-all duration-300 group cursor-pointer"
            >
              {/* Category Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${post.color}`}>
                  {post.category}
                </span>
                <span className="text-xs text-gray-400">{post.readTime}</span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                {post.title}
              </h3>

              {/* Excerpt */}
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                {post.excerpt}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <FiCalendar size={12} />
                  <span>{post.date}</span>
                </div>
                <span className="flex items-center space-x-1 text-sm font-medium text-primary-600 group-hover:translate-x-1 transition-transform">
                  <span>Read More</span>
                  <FiArrowRight size={14} />
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
