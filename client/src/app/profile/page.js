'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiStar, FiShield, FiAlertTriangle, FiMapPin, FiLogOut } from 'react-icons/fi';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import DriverBottomNav from '@/components/DriverBottomNav';
import { useAuth } from '@/context/AuthContext';
import { usersAPI, tripsAPI, ridesAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', city: '', emergencyContact: { name: '', phone: '', relationship: '' } });
  const [tripHistory, setTripHistory] = useState([]);
  const [rideHistory, setRideHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (user) {
      setFormData({ name: user.name || '', phone: user.phone || '', city: user.city || '', emergencyContact: user.emergencyContact || { name: '', phone: '', relationship: '' } });
      tripsAPI.getMyTrips().then((res) => setTripHistory(res.data.trips || [])).catch(console.error);
      ridesAPI.getMyRides().then((res) => setRideHistory(res.data.rides || [])).catch(console.error);
    }
  }, [user, isAuthenticated, authLoading, router]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.updateProfile(formData);
      updateUser(res.data.user);
      setEditing(false);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
    toast.success('Logged out');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-brand-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-700 border-t-accent-400 rounded-full animate-spin" />
      </div>
    );
  }

  const activeTrips = tripHistory.filter((t) => 
    ['open', 'partially_filled', 'full', 'started', 'in_progress'].includes(t.status)
  );

  return (
    <div className="min-h-screen bg-brand-950 page-enter">
      <AppHeader title="My Profile" subtitle="Manage your account" backHref="/dashboard"
        right={
          <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={loading}
            className={`text-sm font-bold px-3 py-1.5 rounded-xl transition-colors ${editing ? 'bg-accent-400 text-brand-900' : 'bg-brand-800 text-brand-300 border border-brand-700'}`}>
            {editing ? (loading ? 'Saving...' : 'Save') : 'Edit'}
          </button>
        }
      />
      <main className="pb-28 max-w-4xl mx-auto px-4 pt-4 sm:px-6">
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Profile Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1">
            <div className="bg-brand-900 rounded-2xl border border-brand-800 p-5 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-accent-500 to-accent-400 rounded-full flex items-center justify-center text-brand-900 text-3xl font-bold overflow-hidden">
                {user?.profilePhoto && user.profilePhoto !== '' ? (
                  <img src={user.profilePhoto} alt={user?.name || 'User'} className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = user?.name?.[0]?.toUpperCase() || 'U'; }} />
                ) : <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>}
              </div>
              <h2 className="text-xl font-bold text-white">{user?.name || 'User'}</h2>
              <p className="text-sm text-brand-400 mb-4">{user?.email || ''}</p>

              <div className="flex items-center justify-center space-x-1 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar key={star} size={18} className={star <= Math.round(user?.rating || 5) ? 'text-accent-400 fill-accent-400' : 'text-brand-700'} />
                ))}
                <span className="ml-2 text-sm text-brand-400">({user?.rating || 5.0})</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { val: user?.totalTrips || 0, label: 'Trips' },
                  { val: user?.totalRatings || 0, label: 'Ratings' },
                  { val: activeTrips.length, label: 'Active' },
                ].map(({ val, label }) => (
                  <div key={label} className="p-3 bg-brand-800 rounded-xl border border-brand-700">
                    <div className="text-lg font-bold text-white">{val}</div>
                    <div className="text-xs text-brand-500">{label}</div>
                  </div>
                ))}
              </div>

              {user?.isVerified && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
                  <FiShield size={16} />
                  <span className="text-sm font-medium">Verified User</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 space-y-4">

            {/* Personal Info */}
            <div className="bg-brand-900 rounded-2xl border border-brand-800 p-5">
              <h3 className="text-base font-semibold text-white mb-4">Personal Information</h3>
              <div className="space-y-4">
                {[
                  { key: 'name', label: 'Full Name', icon: FiUser, type: 'text', placeholder: 'Enter your name', editable: true },
                  { key: 'email', label: 'Email', icon: FiMail, type: 'email', editable: false },
                  { key: 'phone', label: 'Phone', icon: FiPhone, type: 'tel', placeholder: '+91 98765 43210', editable: true },
                  { key: 'city', label: 'City', icon: FiMapPin, type: 'text', placeholder: 'e.g. Pune, Mumbai', editable: true },
                ].map(({ key, label, icon: Icon, type, placeholder, editable }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-brand-500 mb-1">{label}</label>
                    {editing && editable ? (
                      <div className="relative">
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" size={16} />
                        <input type={type} className="input-field pl-10 text-sm" placeholder={placeholder}
                          value={formData[key] || ''} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-brand-800 rounded-xl border border-brand-700">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-700">
                          <Icon className="text-accent-400" size={18} />
                        </div>
                        <span className="text-brand-100 font-medium">{user?.[key] || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-brand-900 rounded-2xl border border-brand-800 p-5">
              <div className="flex items-center space-x-2 mb-4">
                <FiAlertTriangle className="text-amber-400" size={18} />
                <h3 className="text-base font-semibold text-white">Emergency Contact</h3>
              </div>
              {editing ? (
                <div className="space-y-3">
                  <input type="text" className="input-field text-sm" placeholder="Contact name"
                    value={formData.emergencyContact.name}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: e.target.value } })} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="tel" className="input-field text-sm" placeholder="Phone number"
                      value={formData.emergencyContact.phone}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })} />
                    <input type="text" className="input-field text-sm" placeholder="Relationship"
                      value={formData.emergencyContact.relationship}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relationship: e.target.value } })} />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {[['Name', user?.emergencyContact?.name], ['Phone', user?.emergencyContact?.phone], ['Relationship', user?.emergencyContact?.relationship]].map(([label, val]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-brand-500">{label}</span>
                      <span className="text-brand-200">{val || 'Not set'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trip History */}
            <div className="bg-brand-900 rounded-2xl border border-brand-800 p-5">
              <h3 className="text-base font-semibold text-white mb-4">Trip History</h3>
              {tripHistory.length === 0 && rideHistory.length === 0 ? (
                <p className="text-sm text-brand-500 text-center py-6">No trips yet</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {/* Posted trips */}
                  {tripHistory.map((trip) => (
                    <div key={trip._id} className="flex items-center justify-between p-3 bg-brand-800 rounded-xl border border-brand-700">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          trip.status === 'completed' ? 'bg-green-500' : 
                          ['open', 'partially_filled', 'full'].includes(trip.status) ? 'bg-blue-500' : 
                          ['started', 'in_progress'].includes(trip.status) ? 'bg-accent-400' :
                          trip.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                        }`} />
                        <div>
                          <div className="text-xs font-medium text-brand-200 truncate max-w-[180px]">
                            {trip.source?.address?.split(',')[0]} → {trip.destination?.address?.split(',')[0]}
                          </div>
                          <div className="text-xs text-brand-500">{new Date(trip.date).toLocaleDateString()} at {trip.time}</div>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                        trip.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                        ['open', 'partially_filled', 'full'].includes(trip.status) ? 'bg-blue-500/10 text-blue-400' :
                        ['started', 'in_progress'].includes(trip.status) ? 'bg-accent-400/10 text-accent-400' :
                        trip.status === 'cancelled' ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400'
                      }`}>{trip.status}</span>
                    </div>
                  ))}
                  {/* Rides joined (for users who never posted a trip) — exclude if trip already shown above */}
                  {rideHistory
                    .filter((ride) => {
                      // Don't show if this ride's trip is already in tripHistory (poster's own trip)
                      const tripIds = new Set(tripHistory.map((t) => t._id?.toString()));
                      return !ride.trips?.some((t) => tripIds.has(t._id?.toString() || t?.toString()));
                    })
                    .map((ride) => {
                    const trip = ride.trips?.[0];
                    if (!trip) return null;
                    return (
                      <div key={ride._id} className="flex items-center justify-between p-3 bg-brand-800 rounded-xl border border-brand-700">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            ride.status === 'completed' ? 'bg-green-500' : ride.status === 'in_progress' ? 'bg-accent-400' : ride.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                          <div>
                            <div className="text-xs font-medium text-brand-200 truncate max-w-[180px]">
                              {trip.source?.address?.split(',')[0]} → {trip.destination?.address?.split(',')[0]}
                            </div>
                            <div className="text-xs text-brand-500">
                              {new Date(trip.date).toLocaleDateString()} at {trip.time}
                              <span className="ml-1.5 text-brand-600">· joined</span>
                            </div>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                          ride.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          ride.status === 'in_progress' ? 'bg-accent-400/10 text-accent-400' :
                          ride.status === 'cancelled' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>{ride.status === 'in_progress' ? 'active' : ride.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20 active:scale-[0.97] transition-all duration-150"
          >
            <FiLogOut size={17} />
            Log Out
          </button>
        </motion.div>
      </main>
      <BottomNav />
      <DriverBottomNav />
    </div>
  );
}
