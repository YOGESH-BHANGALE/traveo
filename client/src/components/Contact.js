'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fix hydration error by only rendering form after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Message sent successfully! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setLoading(false);
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="section-heading mb-4">
            Get in <span className="gradient-text">Touch</span>
          </h2>
          <p className="section-subheading">
            Have a question or feedback? We&apos;d love to hear from you.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="card">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <FiMail className="text-primary-600" size={20} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Email</div>
                  <div className="text-gray-900">bhangaley214@gmail.com</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                  <FiPhone className="text-accent-600" size={20} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Phone</div>
                  <div className="text-gray-900">+91 8605651090</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FiMapPin className="text-purple-600" size={20} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Address</div>
                  <div className="text-gray-900">DR.D.Y.Patil Institute of Technology, Pimpri</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <form onSubmit={handleSubmit} className="card">
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange('name')}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange('email')}
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="How can we help?"
                  value={formData.subject}
                  onChange={handleChange('subject')}
                  autoComplete="off"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  required
                  rows={5}
                  className="input-field resize-none"
                  placeholder="Tell us more..."
                  value={formData.message}
                  onChange={handleChange('message')}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <FiSend className="mr-2" />
                    Send Message
                  </span>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
