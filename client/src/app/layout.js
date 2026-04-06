import ClientProviders from '@/components/ClientProviders';
import '@/styles/globals.css';

export const metadata = {
  title: 'Traveo - Travel Together, Save Together',
  description: 'Connect with fellow travelers, share rides, and reduce travel costs with Traveo',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Traveo',
  },
};

export const viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Traveo" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#050505" />
        {/* Prevent white flash on PWA launch */}
        <meta name="theme-color" content="#050505" />
        <style>{`html,body{background:#050505}`}</style>
      </head>
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
