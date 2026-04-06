'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiAlertTriangle, FiNavigation } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { autoAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function AutoTrackingPage() {
  const router = useRouter();
  const { autoId } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const [auto, setAuto] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (isAuthenticated && autoId) fetchAuto();
  }, [isAuthenticated, authLoading, autoId]);

  useEffect(() => {
    if (!socket || !autoId) return;
    socket.emit('join_auto', autoId);

    const handleLocation = ({ lat, lng }) => setDriverLocation({ lat, lng });
    const handleCompleted = () => {
      toast.success('Ride completed!');
      router.push('/autoshare');
    };
    const handleDeparted = () => toast('Auto has departed! 🛺', { icon: '🚀' });

    socket.on('auto_location_update', handleLocation);
    socket.on('auto_completed', handleCompleted);
    socket.on('auto_departed', handleDeparted);

    return () => {
      socket.emit('leave_auto', autoId);
      socket.off('auto_location_update', handleLocation);
      socket.off('auto_completed', handleCompleted);
      socket.off('auto_departed', handleDeparted);
    };
  }, [socket, autoId]);

  const fetchAuto = async () => {
    try {
      const res = await autoAPI.getAuto(autoId);
      setAuto(res.data.auto);
      if (res.data.auto.currentLocation?.lat) {
        setDriverLocation({ lat: res.data.auto.currentLocation.lat, lng: res.data.auto.currentLocation.lng });
      }
    } catch { toast.error('Failed to load tracking'); }
    finally { setLoading(false); }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
    </div>
  );

  const STATUS_LABELS = {
    online: 'Waiting for departure',
    boarding: 'Boarding in progress',
    in_progress: 'Ride in progress 🛺',
    completed: 'Ride completed ✅',
  };

  return (
    <div className="min-h-screen bg-brand-950 flex flex-col page-enter">
      <div className="bg-brand-900 border-b border-brand-800 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/autoshare')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 text-brand-300">
            <FiArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Live Tracking</h1>
            <p className="text-xs text-accent-400 font-medium">{STATUS_LABELS[auto?.status] || 'Tracking...'}</p>
          </div>
        </div>
      </div>

      {/* Full-screen map */}
      <div className="flex-1 relative">
        <MapComponent
          userLocation={driverLocation}
          source={auto?.route?.source}
          destination={auto?.route?.destination}
          nearbyTrips={[]}
          height="100%"
          showRoute={true}
        />

        {/* Driver info overlay */}
        {auto && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }}
            className="absolute bottom-4 left-4 right-4 bg-brand-900/95 backdrop-blur rounded-2xl border border-brand-800 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-400 rounded-full flex items-center justify-center text-brand-900 font-bold overflow-hidden">
                {auto.driver?.profilePhoto
                  ? <img src={auto.driver.profilePhoto} alt="" className="w-full h-full object-cover" />
                  : auto.driver?.name?.[0] || '?'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">{auto.driver?.name}</p>
                <p className="text-xs text-brand-400">{auto.vehicleNumber || auto.autoCode}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-400">
                <FiNavigation size={12} className="text-accent-400" />
                <span className="text-accent-400 font-semibold">Live</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { if (socket) socket.emit('sos', { autoId, lat: driverLocation?.lat, lng: driverLocation?.lng }); toast('SOS sent!', { icon: '🆘' }); }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 font-semibold py-2.5 rounded-xl text-sm"
              >
                <FiAlertTriangle size={14} /> SOS
              </button>
              <button
                onClick={() => router.push(`/autoshare/${autoId}`)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-brand-800 border border-brand-700 text-brand-300 font-semibold py-2.5 rounded-xl text-sm"
              >
                View Details
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
