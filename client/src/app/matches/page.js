'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiStar, FiMapPin, FiClock, FiCheck, FiX,
  FiMessageSquare, FiArrowLeft, FiNavigation, FiUsers
} from 'react-icons/fi';
import BottomNav from '@/components/BottomNav';
import DriverBottomNav from '@/components/DriverBottomNav';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { tripsAPI, ridesAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const VEHICLE_ICONS = { car: '🚗', bike: '🏍️', auto: '🛺', any: '🚐' };

function resolveMatchPerspective(match, currentUserId) {
  const isTripOwner = match.trip?.user?._id?.toString() === currentUserId || match.trip?.user?.toString() === currentUserId;
  if (isTripOwner) {
    // I own the trip — other person is the requester
    return { otherUser: match.matchedUser, otherTrip: match.matchedTrip };
  }
  // I am the requester — show the trip I connected to
  return { otherUser: match.trip?.user, otherTrip: match.trip };
}

function MatchesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get('tripId');
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { socket } = useSocket();
  const [matches, setMatches] = useState([]);
  const [trip, setTrip] = useState(null);
  const [myTrips, setMyTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(tripId || '');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (isAuthenticated) {
      if (tripId) fetchMatches(tripId);
      else fetchMyTrips();
    }
  }, [isAuthenticated, authLoading, tripId]);

  const fetchMyTrips = async () => {
    try {
      const res = await tripsAPI.getMyTrips();
      const active = (res.data.trips || []).filter((t) => 
        ['open', 'partially_filled', 'full'].includes(t.status)
      );
      setMyTrips(active);
      if (active.length > 0) {
        setSelectedTripId(active[0]._id);
        await fetchMatches(active[0]._id);
      } else {
        // User has no trips — fetch matches where they are the requester
        await fetchSentRequests();
      }
    } catch (err) { console.error(err); setLoading(false); }
  };

  const fetchSentRequests = async () => {
    setLoading(true);
    try {
      const res = await tripsAPI.getMySentRequests();
      setMatches(res.data.matches || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchMatches = async (tid) => {
    if (!tid) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const tripRes = await tripsAPI.getTrip(tid);
      setTrip(tripRes.data.trip);
      
      // Try to fetch matches, but don't fail if there are none
      try {
        const matchesRes = await tripsAPI.getMatches(tid);
        setMatches(matchesRes.data.matches || []);
      } catch (matchErr) {
        console.log('No matches found for trip:', matchErr.response?.data?.message);
        setMatches([]);
      }
    } catch (err) { 
      console.error('Failed to load trip:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load trip';
      toast.error(errorMsg, { duration: 4000 });
      // If trip not found, redirect back to dashboard
      if (err.response?.status === 404) {
        setTimeout(() => {
          router.push(user?.role === 'driver' ? '/driver/dashboard' : '/dashboard');
        }, 2000);
      }
    }
    finally { setLoading(false); }
  };

  const handleAccept = async (matchId) => {
    setActionLoading(matchId);
    try {
      const res = await ridesAPI.accept(matchId);
      toast.success('Ride confirmed! 🎉 Opening chat...', { duration: 3000 });
      const rideId = res.data.ride?._id;
      if (rideId) router.push(`/chat?rideId=${rideId}`);
      else router.push('/rides');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request.', { duration: 3000 });
    } finally { setActionLoading(null); }
  };

  const handleReject = async (matchId) => {
    setActionLoading(matchId);
    try {
      await ridesAPI.reject(matchId);
      setMatches((p) => p.filter((m) => m._id !== matchId));
      toast('Request declined.', { icon: '❌', duration: 2500 });
    } catch (err) {
      toast.error('Failed to decline. Try again.', { duration: 3000 });
    } finally { setActionLoading(null); }
  };

  const handleCancelTrip = () => {
    if (!trip) return;
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Cancel this trip?</p>
        <p className="text-xs text-brand-400">All pending requests will be removed.</p>
        <div className="flex gap-2 mt-1">
          <button onClick={async () => {
            toast.dismiss(t.id);
            setCancelling(true);
            try {
              await tripsAPI.cancel(trip._id);
              toast.success('Trip cancelled.', { duration: 3000 });
              router.push(user?.role === 'driver' ? '/driver/dashboard' : '/dashboard');
            } catch (err) {
              toast.error(err.response?.data?.message || 'Failed to cancel.', { duration: 3000 });
            } finally { setCancelling(false); }
          }} className="flex-1 bg-red-500 text-white text-xs font-bold py-1.5 rounded-lg">
            Yes, cancel
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 bg-brand-700 text-brand-300 text-xs font-bold py-1.5 rounded-lg">
            Keep it
          </button>
        </div>
      </div>
    ), { duration: 8000, style: { background: '#1a1a2e', border: '1px solid #2d2d44', color: '#fff' } });
  };

  // Real-time: incoming connection request for trip owner
  useEffect(() => {
    if (!socket) return;
    const handleNewRequest = ({ match, fromUser }) => {
      const name = fromUser?.name?.split(' ')[0] || match?.matchedUser?.name?.split(' ')[0] || 'Someone';
      toast(`${name} wants to join your trip! 🔔`, { icon: '🤝', duration: 4000 });
      setMatches((prev) => {
        if (prev.some((m) => m._id === match._id)) return prev;
        return [match, ...prev];
      });
    };
    const handleRideConfirmed = ({ ride, rideId }) => {
      const id = rideId || ride?._id;
      toast.success('Ride confirmed! Opening chat...');
      if (id) router.push(`/chat?rideId=${id}`);
      else router.push('/rides');
    };
    socket.on('new_connection_request', handleNewRequest);
    socket.on('ride_confirmed', handleRideConfirmed);
    return () => {
      socket.off('new_connection_request', handleNewRequest);
      socket.off('ride_confirmed', handleRideConfirmed);
    };
  }, [socket]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-brand-950">
        <div className="bg-brand-900 border-b border-brand-800 px-4 py-3 max-w-2xl mx-auto flex items-center gap-3">
          <div className="skeleton w-9 h-9 rounded-xl" />
          <div className="skeleton h-5 w-24 rounded-lg" />
        </div>
        <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
          <div className="skeleton h-24 rounded-2xl" />
          {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      {/* Header */}
      <div className="bg-brand-900 border-b border-brand-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push(user?.role === 'driver' ? '/driver/dashboard' : '/dashboard')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 hover:bg-brand-700 text-brand-300 transition-colors">
            <FiArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Matches</h1>
            <p className="text-xs text-brand-400">{matches.length} potential companion{matches.length !== 1 ? 's' : ''}</p>
          </div>
          {matches.length > 0 && (
            <div className="w-8 h-8 bg-accent-400/10 rounded-xl flex items-center justify-center">
              <span className="text-xs font-bold text-accent-400">{matches.length}</span>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-28">
        {/* Trip selector */}
        {!tripId && myTrips.length > 1 && (
          <div className="mb-4">
            <select className="w-full bg-brand-800 border border-brand-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent-400"
              value={selectedTripId} onChange={(e) => { setSelectedTripId(e.target.value); fetchMatches(e.target.value); }}>
              {myTrips.map((t) => (
                <option key={t._id} value={t._id}>{t.source?.address?.split(',')[0]} → {t.destination?.address?.split(',')[0]} ({t.time})</option>
              ))}
            </select>
          </div>
        )}

        {/* No trips — show sent requests */}
        {!tripId && myTrips.length === 0 && matches.length === 0 && (
          <div className="bg-brand-900 rounded-2xl border border-dashed border-brand-700 p-10 text-center">
            <div className="w-14 h-14 bg-brand-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FiMapPin className="text-brand-600" size={28} />
            </div>
            <h3 className="font-semibold text-brand-300 mb-1">No requests yet</h3>
            <p className="text-sm text-brand-500 mb-4">Connect with a nearby ride to send a request</p>
            <Link href="/explore" className="inline-flex items-center gap-1.5 bg-accent-400 text-brand-900 text-sm font-bold px-4 py-2.5 rounded-xl">
              <FiNavigation size={14} /> Explore Rides
            </Link>
          </div>
        )}

        {/* Your trip summary */}
        {trip && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-brand-800 to-brand-700 border border-brand-600 rounded-2xl p-4 mb-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wide">Your Trip</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{VEHICLE_ICONS[trip.vehicleType]} {trip.vehicleType}</span>
                <button
                  onClick={handleCancelTrip}
                  disabled={cancelling}
                  className="text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  {cancelling ? '...' : 'Cancel Trip'}
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1 pt-0.5">
                <div className="w-2.5 h-2.5 bg-accent-400 rounded-full" />
                <div className="w-0.5 h-5 bg-brand-500" />
                <div className="w-2.5 h-2.5 bg-brand-400 rounded-full" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-white truncate">{trip.source?.landmark || trip.source?.address?.split(',')[0]}</p>
                <p className="text-xs text-brand-500 truncate">{trip.source?.area || ''}</p>
                <p className="text-sm text-brand-400 truncate">{trip.destination?.landmark || trip.destination?.address?.split(',')[0]}</p>
                <p className="text-xs text-brand-500 truncate">{trip.destination?.area || ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-brand-500">
              <span className="flex items-center gap-1"><FiClock size={11} />{trip.time}</span>
              <span>{new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              {trip.estimatedFare > 0 && <span className="text-accent-400 font-semibold">₹{trip.estimatedFare} total</span>}
            </div>
          </motion.div>
        )}

        {/* No matches */}
        {(tripId || myTrips.length > 0) && matches.length === 0 && (
          <div className="bg-brand-900 rounded-2xl border border-dashed border-brand-700 py-12 text-center">
            <div className="w-14 h-14 bg-brand-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FiUsers className="text-brand-600" size={28} />
            </div>
            <h3 className="font-semibold text-brand-300 mb-1">No matches yet</h3>
            <p className="text-sm text-brand-500 mb-4">Explore and connect with people manually</p>
            <Link href="/explore" className="inline-flex items-center gap-1.5 bg-accent-400 text-brand-900 text-sm font-bold px-4 py-2.5 rounded-xl">
              <FiNavigation size={14} /> Explore Rides
            </Link>
          </div>
        )}

        {/* Match cards */}
        <div className="space-y-3">
          {matches.map((match, i) => {
            const { otherUser, otherTrip } = resolveMatchPerspective(match, user?._id);
            const isSentByMe = match.requestedBy?.toString() === user?._id?.toString() || match.requestedBy?._id?.toString() === user?._id?.toString();
            const scoreColor = match.matchScore >= 70 ? 'text-green-400 bg-green-500/10' : match.matchScore >= 40 ? 'text-accent-400 bg-accent-400/10' : 'text-brand-300 bg-brand-700';

            return (
              <motion.div key={match._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.06, 0.24) }}
                className="bg-brand-900 rounded-2xl border border-brand-800 p-4 hover:border-brand-700 hover:shadow-lg hover:shadow-black/30 transition-all">

                {/* User + score */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-400 rounded-full flex items-center justify-center text-brand-900 font-bold flex-shrink-0 overflow-hidden">
                    {otherUser?.profilePhoto ? <img src={otherUser.profilePhoto} alt="" className="w-full h-full object-cover" /> : otherUser?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white">{otherUser?.name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        otherUser?.role === 'driver'
                          ? 'bg-accent-400/15 text-accent-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}>
                        {otherUser?.role === 'driver' ? '🧑‍✈️ Driver' : '🧑‍💼 Rider'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-brand-400 mt-0.5">
                      <FiStar className="text-accent-400 fill-accent-400" size={11} />
                      <span>{otherUser?.rating || '5.0'}</span>
                      <span>·</span>
                      <span>{VEHICLE_ICONS[otherTrip?.vehicleType]} {otherTrip?.vehicleType}</span>
                    </div>
                  </div>
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-xl ${scoreColor}`}>{match.matchScore}%</span>
                </div>

                {/* Route */}
                <div className="flex gap-3 bg-brand-800 rounded-xl p-3 mb-3">
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="w-0.5 h-5 bg-brand-600" />
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-medium text-brand-200 truncate">{otherTrip?.source?.landmark || otherTrip?.source?.address?.split(',').slice(0, 2).join(',')}</p>
                    <p className="text-[10px] text-brand-500 truncate">{otherTrip?.source?.area || ''}</p>
                    <p className="text-xs text-brand-400 truncate">{otherTrip?.destination?.landmark || otherTrip?.destination?.address?.split(',').slice(0, 2).join(',')}</p>
                    <p className="text-[10px] text-brand-500 truncate">{otherTrip?.destination?.area || ''}</p>
                  </div>
                </div>

                {/* Stats chips */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  <span className="flex items-center gap-1 bg-brand-800 text-brand-300 px-2.5 py-1 rounded-lg text-xs font-medium border border-brand-700">
                    <FiMapPin size={10} /> {(match.distanceDiff / 1000).toFixed(1)} km
                  </span>
                  <span className="flex items-center gap-1 bg-brand-800 text-brand-300 px-2.5 py-1 rounded-lg text-xs font-medium border border-brand-700">
                    <FiClock size={10} /> {match.timeDiff} min diff
                  </span>
                  {otherTrip?.estimatedFare > 0 && (
                    <span className="bg-accent-400/10 text-accent-400 px-2.5 py-1 rounded-lg text-xs font-medium">
                      ₹{Math.ceil(otherTrip.estimatedFare / (otherTrip.seats || 1))}/person
                    </span>
                  )}
                </div>

                {/* Actions */}
                {match.status === 'pending' && !isSentByMe && (
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(match._id)} disabled={actionLoading === match._id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-accent-400 text-brand-900 text-sm font-bold py-2.5 rounded-xl disabled:opacity-50 active:scale-95 transition-all shadow-sm shadow-accent-400/20">
                      {actionLoading === match._id ? <div className="w-4 h-4 border-2 border-brand-900/40 border-t-brand-900 rounded-full animate-spin" /> : <><FiCheck size={14} /> Accept</>}
                    </button>
                    <button onClick={() => handleReject(match._id)} disabled={actionLoading === match._id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/30 text-sm font-bold py-2.5 rounded-xl disabled:opacity-50 active:scale-95 transition-all">
                      <FiX size={14} /> Decline
                    </button>
                  </div>
                )}

                {match.status === 'pending' && isSentByMe && (
                  <div className="flex items-center justify-center gap-2 py-2.5 bg-brand-800 rounded-xl">
                    <div className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" />
                    <span className="text-brand-300 text-sm font-medium">Waiting for response...</span>
                  </div>
                )}

                {match.status === 'accepted' && (
                  <div className="flex items-center justify-between py-2.5 px-3 bg-green-500/10 rounded-xl border border-green-500/20">
                    <span className="text-green-400 font-semibold text-sm flex items-center gap-1.5"><FiCheck size={14} /> Ride Confirmed</span>
                    {match.rideId
                      ? <Link href={`/chat?rideId=${match.rideId}`} className="text-xs text-accent-400 font-bold flex items-center gap-1"><FiMessageSquare size={12} /> Open Chat</Link>
                      : <Link href="/rides" className="text-xs text-accent-400 font-bold flex items-center gap-1"><FiMessageSquare size={12} /> View Ride</Link>
                    }
                  </div>
                )}

                {match.status === 'rejected' && (
                  <div className="py-2.5 bg-brand-800 rounded-xl text-center">
                    <span className="text-brand-500 text-sm">Declined</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </main>
      <BottomNav />
      <DriverBottomNav />
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" /></div>}>
      <MatchesContent />
    </Suspense>
  );
}
