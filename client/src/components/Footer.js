'use client';

import Link from 'next/link';
import { FiMapPin, FiMail, FiPhone, FiGithub, FiTwitter, FiInstagram } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-accent-400 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">DM</span>
              </div>
              <span className="text-xl font-bold text-white">Traveo</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Connect with fellow travelers, share rides, and make your commute more
              affordable and eco-friendly.
            </p>
            <div className="flex space-x-3 mt-6">
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                <FiTwitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                <FiInstagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                <FiGithub size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/#how-it-works" className="text-sm hover:text-primary-400 transition-colors">How It Works</Link></li>
              <li><Link href="/#benefits" className="text-sm hover:text-primary-400 transition-colors">Benefits</Link></li>
              <li><Link href="/#testimonials" className="text-sm hover:text-primary-400 transition-colors">Testimonials</Link></li>
              <li><Link href="/#blog" className="text-sm hover:text-primary-400 transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-semibold mb-4">Features</h3>
            <ul className="space-y-3">
              <li><Link href="/trips/new" className="text-sm hover:text-primary-400 transition-colors">Post a Trip</Link></li>
              <li><Link href="/dashboard" className="text-sm hover:text-primary-400 transition-colors">Find Travel Buddy</Link></li>
              <li><Link href="/rides" className="text-sm hover:text-primary-400 transition-colors">My Rides</Link></li>
              <li><Link href="/profile" className="text-sm hover:text-primary-400 transition-colors">Profile</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2 text-sm">
                <FiMail size={16} className="text-primary-400" />
                <span>bhangaley214@gmail.com</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <FiPhone size={16} className="text-primary-400" />
                <span>+91 8605651090</span>
              </li>
              <li className="flex items-start space-x-2 text-sm">
                <FiMapPin size={16} className="text-primary-400 mt-0.5" />
                <span>DR.D.Y.Patil Institute of Technology, Pimpri, Pune, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Traveo. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
