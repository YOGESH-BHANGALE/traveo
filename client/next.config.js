/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add empty turbopack config to silence the warning
  turbopack: {},
  
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons'],
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  },

  // Proxy API requests to backend server
  async rewrites() {
    // Use BACKEND_URL for production, localhost for development
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendUrl}/socket.io/:path*`,
      },
    ];
  },
};

if (process.env.NODE_ENV === 'production') {
  try {
    const withPWA = require('next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: false,
      // Don't cache API calls — only static assets and pages
      runtimeCaching: [
        {
          // Cache Next.js pages (network-first so content stays fresh)
          urlPattern: /^https:\/\/.*\/_next\/static\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'static-assets',
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
          },
        },
        {
          // Cache images
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
          },
        },
        {
          // Cache Google Fonts
          urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
          },
        },
        {
          // App pages — network first, fall back to cache
          urlPattern: /^https:\/\/.*\/(?:dashboard|explore|matches|rides|profile|trips).*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'app-pages',
            networkTimeoutSeconds: 10,
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
          },
        },
      ],
    });
    module.exports = withPWA(nextConfig);
  } catch (e) {
    console.warn('next-pwa failed to load, skipping PWA config:', e.message);
    module.exports = nextConfig;
  }
} else {
  module.exports = nextConfig;
}
