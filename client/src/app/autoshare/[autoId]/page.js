'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiStar, FiPhone, FiAlertTriangle } from 'react-icons/fi';
import BottomNav from '@/components/BottomNav';
import DriverBottomNav from '@/components/DriverBottomNav';
import SeatMap from '@/components/SeatMap';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { autoAPI, paymentAPI } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/razorpay';
import toast from 'react-hot-toast';

export default function AutoDetailPage() {
  const router = useRouter();
  const { autoId } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const [auto, setAuto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (isAuthenticated && autoId) fetchAuto();
  }, [isAuthenticated, authLoading, autoId]);

  useEffect(() => {
    if (!socket || !autoId) return;
    socket.emit('join_auto', autoId);
    const handleSeatUpdate = ({ availableSeats }) => {
      setAuto((prev) => prev ? { ...prev, availableSeats } : prev);
    };
    const handleDeparted = () => {
      toast('Auto has departed!', { icon: '🛺' });
      router.push('/autoshare');
    };
    socket.on('seat_map_update', handleSeatUpdate);
    socket.on('auto_departed', handleDeparted);
    return () => {
      socket.emit('leave_auto', autoId);
      socket.off('seat_map_update', handleSeatUpdate);
      socket.off('auto_departed', handleDeparted);
    };
  }, [socket, autoId]);

  const fetchAuto = async () => {
    try {
      const res = await autoAPI.getAuto(autoId);
      setAuto(res.data.auto);
    } catch { toast.error('Failed to load auto details'); router.push('/autoshare'); }
    finally { setLoading(false); }
  };

  const bookedSeats = auto?.bookings
    ?.filter((b) => b.status !== 'cancelled')
    .map((b) => b.seatNumber) || [];

  const handleBook = async () => {
    if (!selectedSeat) { toast.error('Please select a seat'); return; }
    setBooking(true);
    try {
      // 1. Create Razorpay order
      const orderRes = await paymentAPI.createOrder({
        amount: auto.farePerSeat,
        description: `AutoShare seat ${selectedSeat} — ${auto.route.source.address?.split(',')[0]} → ${auto.route.destination.address?.split(',')[0]}`,
      });

      // 2. Open Razorpay checkout
      openRazorpayCheckout({
        orderId: orderRes.data.orderId,
        amount: orderRes.data.amount,
        description: `Seat ${selectedSeat}`,
        user,
        onSuccess: async ({ razorpayPaymentId, razorpayOrderId, razorpaySignature }) => {
          try {
            // 3. Book the seat
            const bookRes = await autoAPI.bookSeat(autoId, { seatNumber: selectedSeat });
            const bookingId = bookRes.data.booking._id;

            // 4. Verify payment
            await paymentAPI.verify({ razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId });

            toast.success(`Seat ${selectedSeat} booked!`);
            router.push(`/autoshare/${autoId}/tracking`);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Booking failed after payment');
          } finally { setBooking(false); }
        },
        onFailure: (err) => {
          toast.error(err.message === 'Payment cancelled' ? 'Payment cancelled' : 'Payment failed');
          setBooking(false);
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setBooking(false);
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
    </div>
  );

  if (!auto) return null;

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      <div className="bg-brand-900 border-b border-brand-800 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/autoshare')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 text-brand-300">
            <FiArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Book Auto</h1>
            <p className="text-xs text-brand-400">{auto.autoCode}</p>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-28 space-y-4">
        {/* Driver card */}
        <div className="bg-brand-900 rounded-2xl border border-brand-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-400 rounded-full flex items-center justify-center text-brand-900 font-bold text-xl overflow-hidden">
              {auto.driver?.profilePhoto
                ? <img src={auto.driver.profilePhoto} alt="" className="w-full h-full object-cover" />
                : auto.driver?.name?.[0] || '?'}
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">{auto.driver?.name}</p>
              <div className="flex items-center gap-2 text-xs text-brand-400 mt-0.5">
                <FiStar className="text-accent-400 fill-accent-400" size={11} />
                <span>{auto.driver?.rating || '5.0'}</span>
                {auto.driver?.phone && (
                  <><span>·</span><FiPhone size={10} /><span>{auto.driver.phone}</span></>
                )}
              </div>
              {auto.vehicleNumber && <p className="text-xs text-brand-500 mt-0.5">{auto.vehicleModel} · {auto.vehicleNumber}</p>}
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-accent-400">₹{auto.farePerSeat}</div>
              <div className="text-xs text-brand-500">per seat</div>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="bg-brand-900 rounded-2xl border border-brand-800 p-4">
          <div className="flex gap-3">
            <div className="flex flex-col items-center gap-1 pt-0.5">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div className="w-0.5 h-8 bg-brand-600" />
              <div className="w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-brand-500">From</p>
                <p className="text-sm font-semibold text-white">{auto.route.source.address || 'Source'}</p>
              </div>
              <div>
                <p className="text-xs text-brand-500">To</p>
                <p className="text-sm font-semibold text-white">{auto.route.destination.address || 'Destination'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seat map */}
        <SeatMap
          totalSeats={auto.totalSeats}
          bookedSeats={bookedSeats}
          selectedSeat={selectedSeat}
          onSelect={setSelectedSeat}
          layout="auto"
        />

        {/* Fare summary */}
        {selectedSeat && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-brand-900 rounded-2xl border border-brand-800 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-400">Seat {selectedSeat} · Total</p>
              <p className="text-2xl font-black text-accent-400">₹{auto.farePerSeat}</p>
            </div>
            <div className="text-right text-xs text-brand-500">
              <p>Paid via Razorpay</p>
              <p className="text-green-400 font-medium">Secure checkout</p>
            </div>
          </motion.div>
        )}

        {/* Book button */}
        <button
          onClick={handleBook}
          disabled={!selectedSeat || booking || auto.availableSeats === 0}
          className="w-full flex items-center justify-center gap-2 bg-accent-400 text-brand-900 font-black py-4 rounded-2xl text-base disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-accent-400/20"
        >
          {booking
            ? <div className="w-5 h-5 border-2 border-brand-900/40 border-t-brand-900 rounded-full animate-spin" />
            : `Pay ₹${auto.farePerSeat} & Book Seat ${selectedSeat || '—'}`}
        </button>

        {/* SOS */}
        <button
          onClick={() => { if (socket) socket.emit('sos', { autoId, lat: null, lng: null }); toast('SOS sent to emergency contacts', { icon: '🆘' }); }}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 font-semibold py-3 rounded-2xl text-sm"
        >
          <FiAlertTriangle size={16} /> SOS — Emergency Alert
        </button>
      </main>
      <BottomNav />
      <DriverBottomNav />
    </div>
  );
}
