'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiArrowLeft, FiMapPin, FiTrash2, FiX } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { messagesAPI, ridesAPI } from '@/lib/api';
import toast from 'react-hot-toast';

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rideId = searchParams.get('rideId');
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { socket, isConnected } = useSocket();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(null);
  const [sendingLocation, setSendingLocation] = useState(false);
  // { messageId, isOwn }
  const [contextMenu, setContextMenu] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const longPressRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (isAuthenticated && rideId) fetchData();
  }, [isAuthenticated, authLoading, rideId]);

  useEffect(() => {
    if (!socket || !rideId) return;

    const handleNewMessage = (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
    };
    const handleTyping = (data) => {
      if (data.userId !== user?._id?.toString())
        setTyping(data.isTyping ? data.name : null);
    };
    const handleDeleted = ({ messageId, deleteFor }) => {
      if (deleteFor === 'everyone') {
        setMessages((prev) => prev.map((m) =>
          m._id === messageId
            ? { ...m, text: 'This message was deleted', deletedForEveryone: true }
            : m
        ));
      }
    };
    const handleRideCompleted = ({ rideId: completedId }) => {
      if (completedId?.toString() === rideId?.toString()) {
        setRide((prev) => prev ? { ...prev, status: 'completed' } : prev);
        toast('✅ Ride completed — chat is now closed. Redirecting to rides...', { duration: 3000 });
        setTimeout(() => router.push('/rides'), 2000);
      }
    };
    const handleRideStarted = ({ rideId: startedId }) => {
      if (startedId?.toString() === rideId?.toString()) {
        setRide((prev) => prev ? { ...prev, status: 'in_progress' } : prev);
      }
    };

    socket.emit('join_ride', rideId);
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('message_deleted', handleDeleted);
    socket.on('ride_completed', handleRideCompleted);
    socket.on('ride_started', handleRideStarted);
    // Clear typing indicator on disconnect
    socket.on('disconnect', () => setTyping(null));

    return () => {
      socket.emit('leave_ride', rideId);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('message_deleted', handleDeleted);
      socket.off('ride_completed', handleRideCompleted);
      socket.off('ride_started', handleRideStarted);
      socket.off('disconnect');
      setTyping(null);
    };
  }, [socket, rideId, user?._id]);

  // Close context menu on outside tap
  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const fetchData = async () => {
    try {
      const [rideRes, messagesRes] = await Promise.all([
        ridesAPI.getRide(rideId),
        messagesAPI.getByRide(rideId),
      ]);
      setRide(rideRes.data.ride);
      setMessages(messagesRes.data.messages || []);
      scrollToBottom();
    } catch { toast.error('Failed to load chat'); }
    finally { setLoading(false); }
  };

  const scrollToBottom = () =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const text = newMessage.trim();
    setNewMessage('');
    if (socket && isConnected) {
      socket.emit('send_message', { rideId, text });
      socket.emit('typing', { rideId, isTyping: false });
    } else {
      try {
        const res = await messagesAPI.send({ rideId, text });
        setMessages((prev) => [...prev, res.data.message]);
        scrollToBottom();
      } catch { toast.error('Failed to send message'); }
    }
  };

  const handleTypingInput = () => {
    if (socket && isConnected) {
      socket.emit('typing', { rideId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(
        () => socket.emit('typing', { rideId, isTyping: false }), 2000
      );
    }
  };

  // Long press handlers for mobile
  const startLongPress = (msg, isOwn) => {
    longPressRef.current = setTimeout(() => {
      setContextMenu({ messageId: msg._id, isOwn, deletedForEveryone: msg.deletedForEveryone });
    }, 500);
  };
  const cancelLongPress = () => clearTimeout(longPressRef.current);

  const handleDeleteMessage = async (deleteFor) => {
    if (!contextMenu) return;
    const { messageId } = contextMenu;
    setDeletingId(messageId);
    setContextMenu(null);
    try {
      await messagesAPI.delete(messageId, deleteFor);
      if (deleteFor === 'me') {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
        toast('Message deleted for you.', { icon: '🗑️', duration: 2000 });
      } else {
        setMessages((prev) => prev.map((m) =>
          m._id === messageId
            ? { ...m, text: 'This message was deleted', deletedForEveryone: true }
            : m
        ));
        toast('Message deleted for everyone.', { icon: '🗑️', duration: 2000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally { setDeletingId(null); }
  };

  // Share location as a chat message
  const handleShareLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setSendingLocation(true);
    toast('Getting your location...', { icon: '📡', id: 'loc' });

    let best = null;
    let watchId = null;
    let settled = false;

    const finish = async (pos) => {
      if (settled) return;
      settled = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      toast.dismiss('loc');

      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

      // Reverse geocode via Nominatim (free)
      let address = null;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { 'User-Agent': 'Traveo/1.0', 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        address = data.display_name || null;
      } catch (_) {}

      const accuracyNote = accuracy > 50 ? ` (~${Math.round(accuracy)}m)` : '';
      const text = address
        ? `📍 ${address}${accuracyNote}\n${mapsUrl}`
        : `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}${accuracyNote}\n${mapsUrl}`;

      if (socket && isConnected) {
        socket.emit('send_message', { rideId, text });
      } else {
        try {
          const res = await messagesAPI.send({ rideId, text });
          setMessages((prev) => [...prev, res.data.message]);
          scrollToBottom();
        } catch { toast.error('Failed to send location'); }
      }
      setSendingLocation(false);
    };

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
        if (pos.coords.accuracy <= 30) finish(pos);
      },
      (err) => {
        if (settled) return;
        settled = true;
        navigator.geolocation.clearWatch(watchId);
        toast.dismiss('loc');
        setSendingLocation(false);
        toast.error(err.code === 1 ? 'Location permission denied' : 'Could not get location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    setTimeout(() => {
      if (!settled && best) finish(best);
      else if (!settled) {
        navigator.geolocation.getCurrentPosition(finish, () => {
          if (!settled) {
            settled = true;
            navigator.geolocation.clearWatch(watchId);
            toast.dismiss('loc');
            setSendingLocation(false);
            toast.error('Could not get location');
          }
        }, { enableHighAccuracy: false, timeout: 5000 });
      }
    }, 8000);
  };

  const companion = ride?.users?.find((u) => {
    const uid = u.user?._id?.toString() || u.user?.toString();
    return uid !== user?._id?.toString();
  });
  const isRideClosed = ride?.status === 'completed' || ride?.status === 'cancelled';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-brand-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!rideId) {
    return (
      <div className="min-h-screen bg-brand-950 flex flex-col items-center justify-center gap-4">
        <p className="text-brand-400">No ride selected</p>
        <button onClick={() => router.push('/rides')} className="btn-primary text-sm">View My Rides</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-950 flex flex-col">
      {/* Header */}
      <div className="bg-brand-900 border-b border-brand-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-800 hover:bg-brand-700 text-brand-300 transition-colors">
            <FiArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-400 rounded-full flex items-center justify-center text-brand-900 font-bold flex-shrink-0 overflow-hidden">
            {companion?.user?.profilePhoto
              ? <img src={companion.user.profilePhoto} alt="" className="w-full h-full object-cover" />
              : companion?.user?.name?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">{companion?.user?.name || 'Travel Buddy'}</p>
            <div className="flex items-center gap-1.5 text-xs text-brand-400">
              {isRideClosed ? (
                <span className="text-brand-500">Ride ended · read-only</span>
              ) : (
                <>
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-brand-600'}`} />
                  <span>{isConnected ? 'Online' : 'Offline'}</span>
                  {typing && <span className="text-accent-400">· {typing} is typing...</span>}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <main className="flex-1 pt-4 pb-28 max-w-2xl mx-auto w-full px-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-brand-500 text-sm">No messages yet. Say hi to your travel buddy!</p>
          </div>
        )}
        <div className="space-y-2">
          {messages.map((msg, i) => {
            const isOwn = msg.sender?._id?.toString() === user?._id?.toString();
            const isLocation = msg.text?.startsWith('📍');
            const isDeleted = msg.deletedForEveryone;

            return (
              <motion.div
                key={msg._id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-[78%] px-4 py-2.5 rounded-2xl select-none cursor-pointer ${
                    isOwn
                      ? 'bg-accent-400 text-brand-900 rounded-br-md'
                      : 'bg-brand-800 text-brand-100 border border-brand-700 rounded-bl-md'
                  } ${deletingId === msg._id ? 'opacity-50' : ''}`}
                  onTouchStart={() => !isDeleted && startLongPress(msg, isOwn)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onContextMenu={(e) => { e.preventDefault(); if (!isDeleted) setContextMenu({ messageId: msg._id, isOwn, deletedForEveryone: isDeleted }); }}
                >
                  {isDeleted ? (
                    <p className={`text-sm italic ${isOwn ? 'text-brand-900/50' : 'text-brand-500'}`}>
                      🚫 This message was deleted
                    </p>
                  ) : isLocation ? (
                    (() => {
                      const lines = msg.text.split('\n');
                      const mapsUrl = lines[1];
                      return (
                        <>
                          <p className="text-sm font-medium leading-snug">{lines[0]}</p>
                          {mapsUrl && (
                            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={`inline-flex items-center gap-1 text-[11px] font-bold mt-1.5 px-2 py-1 rounded-lg ${
                                isOwn ? 'bg-brand-900/20 text-brand-900' : 'bg-accent-400/10 text-accent-400'
                              }`}>
                              🗺 Open in Maps ↗
                            </a>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  )}
                  <p className={`text-[10px] mt-1 ${isOwn ? 'text-brand-900/50' : 'text-brand-500'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Context menu for delete */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-end justify-center pb-32 px-4"
            onClick={() => setContextMenu(null)}
          >
            <div
              className="bg-brand-800 border border-brand-700 rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-brand-700">
                <p className="text-xs text-brand-400 font-medium">Message options</p>
              </div>
              <button
                onClick={() => handleDeleteMessage('me')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-brand-700 transition-colors text-left"
              >
                <FiTrash2 size={16} className="text-brand-400" />
                <div>
                  <p className="text-sm font-semibold text-white">Delete for me</p>
                  <p className="text-xs text-brand-500">Only you won't see this message</p>
                </div>
              </button>
              {contextMenu.isOwn && !contextMenu.deletedForEveryone && (
                <button
                  onClick={() => handleDeleteMessage('everyone')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-brand-700 transition-colors text-left border-t border-brand-700"
                >
                  <FiTrash2 size={16} className="text-red-400" />
                  <div>
                    <p className="text-sm font-semibold text-red-400">Delete for everyone</p>
                    <p className="text-xs text-brand-500">Remove for all participants</p>
                  </div>
                </button>
              )}
              <button
                onClick={() => setContextMenu(null)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-brand-700 transition-colors text-left border-t border-brand-700"
              >
                <FiX size={16} className="text-brand-400" />
                <p className="text-sm text-brand-300">Cancel</p>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      {isRideClosed ? (
        <div className="fixed bottom-0 left-0 right-0 bg-brand-900 border-t border-brand-800 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 text-brand-500 text-sm">
            <span className="w-2 h-2 rounded-full bg-brand-600" />
            {ride?.status === 'completed' ? 'Ride completed — chat is now closed' : 'Ride cancelled — chat is closed'}
          </div>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 bg-brand-900 border-t border-brand-800 px-4 py-3">
          <form onSubmit={handleSend} className="max-w-2xl mx-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareLocation}
              disabled={sendingLocation}
              title="Share your current location"
              className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-brand-800 border border-brand-700 text-brand-400 hover:text-accent-400 hover:border-accent-400 transition-colors disabled:opacity-50"
            >
              {sendingLocation
                ? <div className="w-4 h-4 border-2 border-brand-600 border-t-accent-400 rounded-full animate-spin" />
                : <FiMapPin size={18} />}
            </button>
            <input
              type="text"
              className="input-field flex-1"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => { setNewMessage(e.target.value); handleTypingInput(); }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="w-11 h-11 flex-shrink-0 bg-accent-400 hover:bg-accent-300 text-brand-900 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <FiSend size={18} />
            </button>
          </form>
          <p className="text-center text-[10px] text-brand-600 mt-1.5">Hold a message to delete it</p>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
