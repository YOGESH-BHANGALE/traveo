'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiClock, FiMessageSquare, FiPlay, FiCheckCircle,
  FiStar, FiNavigation, FiArrowLeft, FiPhone, FiChevronDown,
  FiChevronUp, FiCalendar, FiDollarSign
} from 'react-icons/fi';
import BottomNav from '@/components/BottomNav';
import DriverBottomNav from '@/components/DriverBottomNav';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { ridesAPI, messagesAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  confirmed:   { label: 'Confirmed',   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',   dot: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'text-accent-400', bg: 'bg-accent-400/10 border-accent-400/20', dot: 'bg-accent-400 animate-pulse' },
  completed:   { label: 'Completed',   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',  dot: 'bg-green-500' },
  cancelled:   { label: 'Cancelled',   color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',      dot: 'bg-red-500' },
};

function PastRideCard({ ride, user, highlightRideId }) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingData, setRatingData] = useState({ score: 5, comment: '' });
  const [ratingLoading, setRatingLoading] = useState(false);
  const [rated, setRated] = useState(false);

  // Auto-expand if this ride matches the highlighted ride ID
  useEffect(() => {
    if (highlightRideId && ride._id === highlightRideId) {
      setExpanded(true);
      loadMessages();
      // Scroll to this ride after a short delay
      setTimeout(() => {
        const element = document.getElementById(`ride-${ride._id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [highlightRideId, ride._id]);

  // Check if current user already rated this ride
  useEffect(() => {
    if (ride.ratings?.some((r) => r.fromUser?.toString() === user?._id?.toString())) {
      setRated(true);
    }
  }, [ride.ratings, user?._id]);

  const companion = ride.users?.find((u) => {
    const uid = u.user?._id?.toString() || u.user?.toString();
    return uid !== user?._id?.toString();
  });

  // Determine current user's role — only 'joiner' can rate
  const myEntry = ride.users?.find((u) => {
    const uid = u.user?._id?.toString() || u.user?.toString();
    return uid === user?._id?.toString();
  });
  const isCreator = myEntry?.role === 'creator';

  const trip = ride.trips?.[0];
  const status = STATUS_CONFIG[ride.status] || STATUS_CONFIG.completed;

  const loadMessages = async () => {
    if (messages !== null) return;
    setLoadingMsgs(true);
    try {
      const res = await messagesAPI.getByRide(ride._id);
      setMessages(res.data.messages || []);
    } catch { setMessages([]); }
    finally { setLoadingMsgs(false); }
  };

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadMessages();
  };

  const handleRate = async () => {
    if (!companion?.user?._id) return;
    setRatingLoading(true);
    try {
      await ridesAPI.rate(ride._id, {
        toUserId: companion.user._id,
        score: ratingData.score,
        comment: ratingData.comment,
      });
      setRated(true);
      setShowRating(false);
      toast.success(`You rated ${companion.user?.name?.split(' ')[0]} ${ratingData.score} ⭐`, { duration: 3500 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating. Try again.', { duration: 3000 });
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <div id={`ride-${ride._id}`} className="bg-brand-900 rounded-2xl border border-brand-800 overflow-hidden">
      {/* Status bar */}
      <div className={`border ${status.bg} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
          <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
        </div>
        <span className="text-xs text-brand-500 font-mono">{ride.rideCode}</span>
      </div>

      <div className="p-4">
        {/* Companion */}
        {companion && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-gradient-to-br from-accent-500 to-accent-400 rounded-full flex items-center justify-center text-brand-900 font-bold overflow-hidden flex-shrink-0">
              {companion.user?.profilePhoto
                ? <img src={companion.user.profilePhoto} alt="" className="w-full h-full object-cover" />
                : companion.user?.name?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">{companion.user?.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-brand-400">
                <FiStar className="text-accent-400 fill-accent-400" size={10} />
                <span>{companion.user?.rating || '5.0'}</span>
                {companion.user?.phone && (
                  <><span>·</span><span className="flex items-center gap-1"><FiPhone size={10} />{companion.user.phone}</span></>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trip route */}
        {trip && (
          <div className="bg-brand-800 rounded-xl p-3 mb-3 border border-brand-700">
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1 pt-0.5">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                <div className="w-0.5 h-5 bg-brand-600" />
                <div className="w-2.5 h-2.5 bg-accent-400 rounded-full" />
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{trip.source?.landmark || trip.source?.address?.split(',').slice(0, 2).join(',')}</p>
                <p className="text-[10px] text-brand-500 truncate">{trip.source?.area || ''}</p>
                <p className="text-xs text-brand-400 truncate">{trip.destination?.landmark || trip.destination?.address?.split(',').slice(0, 2).join(',')}</p>
                <p className="text-[10px] text-brand-500 truncate">{trip.destination?.area || ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-brand-700 text-xs text-brand-500">
              <span className="flex items-center gap-1"><FiCalendar size={10} />{new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span className="flex items-center gap-1"><FiClock size={10} />{trip.time}</span>
            </div>
          </div>
        )}

        {/* Fare */}
        <div className="flex items-center justify-between bg-brand-800 border border-brand-700 rounded-xl px-3 py-2.5 mb-3">
          <div className="flex items-center gap-2 text-xs text-brand-400">
            <FiDollarSign size={13} className="text-accent-400" />
            <span>Your share</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-accent-400">₹{ride.farePerPerson || Math.ceil(ride.totalFare / (ride.users?.length || 2))}</span>
            <span className="text-xs text-brand-500 ml-1.5">of ₹{ride.totalFare} total</span>
            {ride.totalFare > 0 && (() => {
              const perPerson = ride.farePerPerson || Math.ceil(ride.totalFare / (ride.users?.length || 2));
              const savedPct = Math.round(((ride.totalFare - perPerson) / ride.totalFare) * 100);
              return savedPct > 0
                ? <p className="text-xs text-green-400 font-medium mt-0.5">{savedPct}% saved 🎉</p>
                : null;
            })()}
          </div>
        </div>

        {/* Expand chat history */}
        <button
          onClick={handleExpand}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-brand-800 border border-brand-700 rounded-xl text-sm text-brand-300 hover:bg-brand-700 transition-colors"
        >
          <span className="flex items-center gap-2 font-medium">
            <FiMessageSquare size={14} className="text-accent-400" />
            Chat History
          </span>
          {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 bg-brand-800/50 rounded-xl border border-brand-700 max-h-64 overflow-y-auto p-3 space-y-2">
                {loadingMsgs ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-brand-600 border-t-accent-400 rounded-full animate-spin" />
                  </div>
                ) : messages?.length === 0 ? (
                  <p className="text-xs text-brand-500 text-center py-4">No messages in this chat</p>
                ) : (
                  messages?.map((msg, i) => {
                    const isOwn = msg.sender?._id?.toString() === user?._id?.toString();
                    const isDeleted = msg.deletedForEveryone;
                    const isLocation = msg.text?.startsWith('📍');
                    return (
                      <div key={msg._id || i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${
                          isOwn ? 'bg-accent-400/20 text-accent-400' : 'bg-brand-700 text-brand-200'
                        }`}>
                          {!isOwn && (
                            <p className="font-bold text-[10px] text-brand-400 mb-0.5">{msg.sender?.name}</p>
                          )}
                          {isDeleted ? (
                            <p className="italic text-brand-500">🚫 Deleted</p>
                          ) : isLocation ? (
                            (() => {
                              const lines = msg.text.split('\n');
                              return (
                                <>
                                  <p>{lines[0]}</p>
                                  {lines[1] && (
                                    <a href={lines[1]} target="_blank" rel="noopener noreferrer"
                                      className="text-accent-400 underline text-[10px]">Open in Maps ↗</a>
                                  )}
                                </>
                              );
                            })()
                          ) : (
                            <p>{msg.text}</p>
                          )}
                          <p className="text-[9px] text-brand-500 mt-0.5">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rating — only for completed rides, only joiners can rate the creator */}
        {ride.status === 'completed' && companion && (
          <div className="mt-3">
            {isCreator ? (
              // Trip poster cannot rate — show neutral info badge
              <div className="flex items-center justify-center gap-2 py-2.5 bg-brand-800 border border-brand-700 rounded-xl">
                <FiStar size={13} className="text-brand-500" />
                <span className="text-xs text-brand-500">Ratings are given by your travel companions</span>
              </div>
            ) : rated ? (
              <div className="flex items-center justify-center gap-2 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
                <FiStar size={14} className="text-green-400 fill-green-400" />
                <span className="text-xs font-semibold text-green-400">You rated {companion.user?.name?.split(' ')[0]}</span>
              </div>
            ) : showRating ? (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="bg-brand-800 border border-brand-700 rounded-xl p-3 space-y-3">
                <p className="text-xs font-semibold text-brand-300">Rate {companion.user?.name?.split(' ')[0]}</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRatingData((p) => ({ ...p, score: star }))}>
                      <FiStar size={26} className={star <= ratingData.score ? 'text-accent-400 fill-accent-400' : 'text-brand-600'} />
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full bg-brand-900 border border-brand-700 text-white rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:border-accent-400 placeholder:text-brand-600"
                  rows={2} placeholder="Leave a comment (optional)"
                  value={ratingData.comment}
                  onChange={(e) => setRatingData((p) => ({ ...p, comment: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button onClick={handleRate} disabled={ratingLoading}
                    className="flex-1 bg-accent-400 text-brand-900 font-bold py-2 rounded-xl text-xs disabled:opacity-50">
                    {ratingLoading ? 'Submitting...' : 'Submit'}
                  </button>
                  <button onClick={() => setShowRating(false)}
                    className="px-3 bg-brand-700 text-brand-300 font-semibold py-2 rounded-xl text-xs border border-brand-600">
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <button onClick={() => setShowRating(true)}
                className="w-full flex items-center justify-center gap-2 bg-brand-800 border border-brand-700 text-brand-300 font-semibold py-2.5 rounded-xl text-sm hover:bg-brand-700 transition-colors">
                <FiStar size={14} className="text-accent-400" />
                Rate {companion.user?.name?.split(' ')[0]}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RidesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [highlightRideId, setHighlightRideId] = useState(null);

  // Check for rideId in URL query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const rideId = params.get('rideId');
      if (rideId) {
        setHighlightRideId(rideId);
        // Auto-switch to past tab if needed (will be determined after rides load)
      }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!isAuthenticated) return;
    fetchRides();
    // Second fetch after short delay to catch any race condition (e.g. just accepted a ride)
    const retryTimer = setTimeout(() => fetchRides(), 1500);
    // Re-fetch when user returns to this tab (e.g. after completing ride in chat)
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchRides(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (!socket) return;
    const handleRideConfirmed = ({ rideId }) => {
      toast.success('Ride confirmed!');
      setActiveTab('active');
      fetchRides();
      if (rideId) setTimeout(() => router.push(`/chat?rideId=${rideId}`), 800);
    };
    const handleRideStarted = () => { toast.success('Ride has started! 🚀', { duration: 3000 }); fetchRides(); };
    const handleRideCompleted = () => { toast.success('Ride completed! 🎉 Rate your companion.', { duration: 4000 }); fetchRides(); setActiveTab('past'); };
    socket.on('ride_confirmed', handleRideConfirmed);
    socket.on('ride_started', handleRideStarted);
    socket.on('ride_completed', handleRideCompleted);
    return () => {
      socket.off('ride_confirmed', handleRideConfirmed);
      socket.off('ride_started', handleRideStarted);
      socket.off('ride_completed', handleRideCompleted);
    };
  }, [socket]);

  const fetchRides = async () => {
    try {
      const res = await ridesAPI.getMyRides();
      const fetched = res.data.rides || [];
      
      // Rides are now already grouped by trip on the backend
      // Just check if a ride has multiple riders (users array length > 2)
      const processedRides = fetched.map(ride => {
        const myTrip = ride.trips?.find(t => t.user?._id === user?._id || t.user === user?._id);
        const isGroupedRide = ride.users && ride.users.length > 2; // Driver + multiple riders
        
        if (isGroupedRide) {
          return {
            ...ride,
            isGroupedRide: true,
            tripId: myTrip?._id,
            trip: myTrip,
            totalRiders: ride.users.length - 1, // Exclude driver
          };
        }
        
        return ride;
      });
      
      setRides(processedRides);
      
      // If we have a highlighted ride ID, switch to the appropriate tab
      if (highlightRideId) {
        const highlightedRide = processedRides.find(r => 
          r._id === highlightRideId || 
          r.groupedRides?.some(gr => gr._id === highlightRideId)
        );
        if (highlightedRide) {
          if (['completed', 'cancelled'].includes(highlightedRide.status)) {
            setActiveTab('past');
          } else {
            setActiveTab('active');
          }
          // Scroll to the highlighted ride after a short delay
          setTimeout(() => {
            const element = document.getElementById(`ride-${highlightedRide._id}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        }
      } else {
        // Auto-switch to past tab if no active rides but past rides exist
        const hasActive = processedRides.some((r) => ['confirmed', 'in_progress'].includes(r.status));
        const hasPast = processedRides.some((r) => ['completed', 'cancelled'].includes(r.status));
        if (!hasActive && hasPast) setActiveTab('past');
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAction = async (action, rideId) => {
    setActionLoading(rideId);
    try {
      if (action === 'start') {
        await ridesAPI.start(rideId);
        toast.success('Ride started! 🚀 Have a safe journey.', { duration: 3500 });
      }
      if (action === 'complete') {
        await ridesAPI.complete(rideId);
        toast.success('Ride completed! 🎉 Check Past Rides to rate your companion.', { duration: 4000 });
        await fetchRides();
        setActiveTab('past');
        return;
      }
      fetchRides();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed. Please try again.', { duration: 3000 });
    } finally { setActionLoading(null); }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-brand-950">
        <div className="bg-brand-900 border-b border-brand-800 px-4 py-3 max-w-2xl mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <div className="skeleton w-9 h-9 rounded-xl" />
            <div className="skeleton h-5 w-20 rounded-lg" />
          </div>
          <div className="skeleton h-10 w-full rounded-xl" />
        </div>
        <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
          {[1, 2].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const activeRides = rides.filter((r) => ['confirmed', 'in_progress'].includes(r.status));
  const pastRides = rides.filter((r) => ['completed', 'cancelled'].includes(r.status));
  const displayRides = activeTab === 'active' ? activeRides : pastRides;

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      {/* Header */}
      <div className="bg-brand-900 border-b border-brand-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button 
              onClick={() => router.push(user?.role === 'driver' ? '/driver/dashboard' : '/dashboard')}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 hover:bg-brand-700 text-brand-300 transition-colors"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">My Rides</h1>
              <p className="text-xs text-brand-400">{rides.length} total ride{rides.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex bg-brand-800 rounded-xl p-1">
            {[
              { key: 'active', label: 'Active', count: activeRides.length },
              { key: 'past', label: 'Past Rides', count: pastRides.length },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.key ? 'bg-brand-700 text-white shadow-sm' : 'text-brand-500'
                }`}>
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.key ? 'bg-accent-400/20 text-accent-400' : 'bg-brand-700 text-brand-500'
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-28">
        {/* Complete All Button - Show for trip creators with in-progress rides */}
        {activeTab === 'active' && activeRides.some(r => r.status === 'in_progress' && r.users?.find(u => u.user?._id === user?._id || u.user === user?._id)?.role === 'creator') && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <button
              onClick={async () => {
                const inProgressRides = activeRides.filter(r => r.status === 'in_progress');
                if (inProgressRides.length === 0) return;
                
                setActionLoading('complete-all');
                try {
                  await Promise.all(inProgressRides.map(ride => ridesAPI.complete(ride._id)));
                  toast.success(`${inProgressRides.length} ride${inProgressRides.length > 1 ? 's' : ''} completed! 🎉`, { duration: 4000 });
                  fetchRides();
                  setActiveTab('past');
                } catch (error) {
                  toast.error('Failed to complete some rides');
                } finally {
                  setActionLoading(null);
                }
              }}
              disabled={actionLoading === 'complete-all'}
              className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg"
            >
              {actionLoading === 'complete-all' ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheckCircle size={18} />
                  Complete All Rides ({activeRides.filter(r => r.status === 'in_progress').length})
                </>
              )}
            </button>
          </motion.div>
        )}

        {displayRides.length === 0 ? (
          <div className="bg-brand-900 rounded-2xl border border-dashed border-brand-700 py-14 text-center">
            <div className="w-14 h-14 bg-brand-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FiNavigation className="text-brand-600" size={28} />
            </div>
            <h3 className="font-semibold text-brand-300 mb-1">
              {activeTab === 'active' ? 'No active rides' : 'No past rides'}
            </h3>
            <p className="text-sm text-brand-500 mb-4">
              {activeTab === 'active' ? 'Confirmed rides will appear here' : 'Completed rides will appear here'}
            </p>
            {activeTab === 'active' && (
              <Link href="/matches" className="inline-flex items-center gap-1.5 bg-accent-400 text-brand-900 text-sm font-bold px-4 py-2.5 rounded-xl">
                View Matches
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Past rides use the rich PastRideCard */}
            {activeTab === 'past' && displayRides.map((ride, index) => (
              <motion.div key={ride._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.06, 0.18) }}>
                <PastRideCard ride={ride} user={user} highlightRideId={highlightRideId} />
              </motion.div>
            ))}

            {/* Active rides */}
            {activeTab === 'active' && displayRides.map((ride, index) => {
              // Check if this is a grouped ride (multiple riders for same trip)
              if (ride.isGroupedRide) {
                const isCreator = ride.users?.find(u => 
                  (u.user?._id?.toString() || u.user?.toString()) === user?._id?.toString()
                )?.role === 'creator';
                const status = STATUS_CONFIG[ride.status] || STATUS_CONFIG.confirmed;
                const isLoading = actionLoading === ride._id;
                
                // Get all riders (exclude the driver/creator)
                const allRiders = ride.users?.filter(u => 
                  u.role === 'joiner'
                ) || [];

                return (
                  <motion.div key={ride._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.07, 0.21) }}
                    id={`ride-${ride._id}`}
                    className="bg-brand-900 rounded-2xl border border-brand-800 overflow-hidden">

                    <div className={`border ${status.bg} px-4 py-2.5 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                        <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
                        <span className="text-xs bg-accent-400/10 text-accent-400 font-bold px-2 py-0.5 rounded-full">
                          {ride.totalRiders} Riders
                        </span>
                      </div>
                      <button 
                        onClick={() => ride.tripId && router.push(`/trips/${ride.tripId}`)}
                        className="text-xs text-brand-500 font-mono hover:text-accent-400 transition-colors"
                      >
                        {ride.rideCode} →
                      </button>
                    </div>

                    <div className="p-4">
                      {/* All Riders List */}
                      <div className="mb-4 pb-4 border-b border-brand-800">
                        <p className="text-xs text-brand-500 mb-2">Riders on this trip:</p>
                        <div className="space-y-2">
                          {allRiders.map((riderEntry, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-400 rounded-full flex items-center justify-center text-brand-900 font-bold overflow-hidden">
                                {riderEntry.user?.profilePhoto
                                  ? <img src={riderEntry.user.profilePhoto} alt="" className="w-full h-full object-cover" />
                                  : riderEntry.user?.name?.[0] || '?'}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-white">{riderEntry.user?.name}</p>
                                <div className="flex items-center gap-2 text-xs text-brand-400">
                                  <FiStar className="text-accent-400 fill-accent-400" size={10} />
                                  <span>{riderEntry.user?.rating || '5.0'}</span>
                                </div>
                              </div>
                              <Link href={`/chat?rideId=${ride._id}&userId=${riderEntry.user._id}`}
                                className="w-8 h-8 bg-accent-400/10 rounded-lg flex items-center justify-center text-accent-400">
                                <FiMessageSquare size={14} />
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-brand-800 border border-brand-700 rounded-xl p-3 mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-brand-500 mb-0.5">Total fare</p>
                          <p className="text-2xl font-bold text-accent-400">
                            ₹{allRiders.reduce((sum, r) => sum + (r.fare || 0), 0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-brand-500">Per person</p>
                          <p className="text-sm font-semibold text-brand-300">
                            ₹{ride.farePerPerson || 0}
                          </p>
                        </div>
                      </div>

                      {ride.status === 'confirmed' && isCreator && (
                        <button 
                          onClick={() => {
                            // Start the ride (now just one ride for all riders)
                            setActionLoading(ride._id);
                            ridesAPI.start(ride._id)
                              .then(() => {
                                toast.success('Trip started for all riders! 🚀', { duration: 3500 });
                                fetchRides();
                              })
                              .catch(() => toast.error('Failed to start trip'))
                              .finally(() => setActionLoading(null));
                          }}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 bg-accent-400 text-brand-900 font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-all"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-brand-900/40 border-t-brand-900 rounded-full animate-spin" />
                          ) : (
                            <><FiPlay size={16} /> Start Trip for All Riders</>
                          )}
                        </button>
                      )}

                      {ride.status === 'in_progress' && isCreator && (
                        <button 
                          onClick={() => {
                            // Complete the ride (now just one ride for all riders)
                            setActionLoading(ride._id);
                            ridesAPI.complete(ride._id)
                              .then(() => {
                                toast.success('Trip completed! 🎉', { duration: 4000 });
                                fetchRides();
                                setActiveTab('past');
                              })
                              .catch(() => toast.error('Failed to complete trip'))
                              .finally(() => setActionLoading(null));
                          }}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-all"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                            <><FiCheckCircle size={16} /> Complete Trip</>
                          )}
                        </button>
                      )}

                      {!isCreator && ride.status === 'confirmed' && (
                        <div className="flex items-center justify-center gap-2 bg-brand-800 border border-brand-700 text-brand-400 font-medium py-3 rounded-xl text-sm">
                          <div className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" />
                          Waiting for trip poster to start...
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              }

              // Regular single ride display
              const companion = ride.users?.find((u) => {
                const uid = u.user?._id?.toString() || u.user?.toString();
                return uid !== user?._id?.toString();
              });
              const myEntry = ride.users?.find((u) => {
                const uid = u.user?._id?.toString() || u.user?.toString();
                return uid === user?._id?.toString();
              });
              const isCreator = myEntry?.role === 'creator';
              const status = STATUS_CONFIG[ride.status] || STATUS_CONFIG.confirmed;
              const isLoading = actionLoading === ride._id;

              return (
                <motion.div key={ride._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.07, 0.21) }}
                  id={`ride-${ride._id}`}
                  className="bg-brand-900 rounded-2xl border border-brand-800 overflow-hidden">

                  <div className={`border ${status.bg} px-4 py-2.5 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                      <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
                    </div>
                    <span className="text-xs text-brand-500 font-mono">{ride.rideCode}</span>
                  </div>

                  <div className="p-4">
                    {companion && (
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-brand-800">
                        <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-400 rounded-full flex items-center justify-center text-brand-900 font-bold text-lg overflow-hidden">
                          {companion.user?.profilePhoto
                            ? <img src={companion.user.profilePhoto} alt="" className="w-full h-full object-cover" />
                            : companion.user?.name?.[0] || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-white">{companion.user?.name}</p>
                          <div className="flex items-center gap-2 text-xs text-brand-400 mt-0.5">
                            <FiStar className="text-accent-400 fill-accent-400" size={11} />
                            <span>{companion.user?.rating || '5.0'}</span>
                            {companion.user?.phone && (
                              <><span>·</span><span className="flex items-center gap-1"><FiPhone size={10} />{companion.user.phone}</span></>
                            )}
                          </div>
                        </div>
                        <Link href={`/chat?rideId=${ride._id}`}
                          className="w-10 h-10 bg-accent-400/10 rounded-xl flex items-center justify-center text-accent-400">
                          <FiMessageSquare size={18} />
                        </Link>
                      </div>
                    )}

                    <div className="bg-brand-800 border border-brand-700 rounded-xl p-3 mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-brand-500 mb-0.5">Your share</p>
                        <p className="text-2xl font-bold text-accent-400">₹{ride.farePerPerson || Math.ceil(ride.totalFare / (ride.users?.length || 2))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-brand-500">Total fare</p>
                        <p className="text-sm font-semibold text-brand-300">₹{ride.totalFare}</p>
                        {ride.totalFare > 0 && (() => {
                          const perPerson = ride.farePerPerson || Math.ceil(ride.totalFare / (ride.users?.length || 2));
                          const savedPct = Math.round(((ride.totalFare - perPerson) / ride.totalFare) * 100);
                          return savedPct > 0
                            ? <p className="text-xs text-green-400 font-medium mt-0.5">{savedPct}% saved 🎉</p>
                            : null;
                        })()}
                      </div>
                    </div>

                    {ride.status === 'confirmed' && (
                      <div className="flex gap-2">
                        {isCreator ? (
                          <button onClick={() => handleAction('start', ride._id)} disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 bg-accent-400 text-brand-900 font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-all">
                            {isLoading ? <div className="w-4 h-4 border-2 border-brand-900/40 border-t-brand-900 rounded-full animate-spin" /> : <><FiPlay size={16} /> Start Ride</>}
                          </button>
                        ) : (
                          <div className="flex-1 flex items-center justify-center gap-2 bg-brand-800 border border-brand-700 text-brand-400 font-medium py-3 rounded-xl text-sm">
                            <div className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" />
                            Waiting for trip poster to start...
                          </div>
                        )}
                        <Link href={`/chat?rideId=${ride._id}`}
                          className="flex items-center justify-center gap-2 bg-brand-800 text-brand-300 font-bold py-3 px-4 rounded-xl border border-brand-700">
                          <FiMessageSquare size={16} /> Chat
                        </Link>
                      </div>
                    )}

                    {ride.status === 'in_progress' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleAction('complete', ride._id)} disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-all">
                          {isLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><FiCheckCircle size={16} /> Complete Ride</>}
                        </button>
                        <Link href={`/chat?rideId=${ride._id}`}
                          className="flex items-center justify-center gap-2 bg-brand-800 text-brand-300 font-bold py-3 px-4 rounded-xl border border-brand-700">
                          <FiMessageSquare size={16} /> Chat
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

          </div>
        )}
      </main>
      <BottomNav />
      <DriverBottomNav />
    </div>
  );
}
