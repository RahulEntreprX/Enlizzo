
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Settings, Package, Heart, Gift, X, ArrowLeft, Trash2, History, Camera, Archive } from 'lucide-react';
import { Button } from '../components/Button';
import { updateUserProfile, requestAccountDeletion, fetchRecentlyViewedIds, uploadImage } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

interface ProfileProps {
  user: User;
  products: Product[];
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  onProductClick: (product: Product) => void;
  onBack?: () => void;
  onLogout: () => void;
  onProfileUpdate?: (updatedUser: User) => void;
  isDemo: boolean;
}

export const Profile: React.FC<ProfileProps> = ({
  user,
  products,
  savedIds,
  onToggleSave,
  onProductClick,
  onBack,
  onLogout,
  onProfileUpdate,
  isDemo
}) => {
  const { currentCampus } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'donations' | 'saved' | 'recent' | 'archive'>('listings');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  // Removed isSaving as we are now Optimistic (Instant)
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  const [editForm, setEditForm] = useState({
    name: user.name,
    hostel: user.hostel,
    phone: user.phone || '',
    email: user.email,
    year: user.year || '',
    bio: user.bio || '',
    avatarUrl: user.avatarUrl
  });

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const HOSTEL_LIST = currentCampus?.hostels || [];

  useEffect(() => {
    fetchRecentlyViewedIds(user.id, isDemo).then(setRecentlyViewedIds);
  }, [user.id, isDemo]);

  // Real-time check for changes
  const hasChanges = useMemo(() => {
    const normalize = (val: string | undefined | null) => (val || '').trim();

    return (
      normalize(editForm.name) !== normalize(user.name) ||
      normalize(editForm.hostel) !== normalize(user.hostel) ||
      normalize(editForm.phone) !== normalize(user.phone) ||
      normalize(editForm.year) !== normalize(user.year) ||
      normalize(editForm.bio) !== normalize(user.bio) ||
      editForm.avatarUrl !== user.avatarUrl
    );
  }, [editForm, user]);

  const items = useMemo(() => {
    return products.filter(p => {
      // Listings: Only active, unsold items
      if (activeTab === 'listings') return p.sellerId === user.id && p.price > 0 && !p.isSold && p.status !== 'SOLD' && p.status !== 'ARCHIVED';

      // Donations: Only active, unsold items
      if (activeTab === 'donations') return p.sellerId === user.id && p.price === 0 && !p.isSold && p.status !== 'SOLD' && p.status !== 'ARCHIVED';

      // Archive: Sold OR Archived items
      if (activeTab === 'archive') return p.sellerId === user.id && (p.isSold || p.status === 'SOLD' || p.status === 'ARCHIVED');

      if (activeTab === 'saved') return savedIds.has(p.id);
      if (activeTab === 'recent') return recentlyViewedIds.includes(p.id);
      return false;
    });
  }, [activeTab, products, user.id, savedIds, recentlyViewedIds]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setIsUploadingAvatar(true);
    try {
      const url = await uploadImage(file);
      setEditForm(prev => ({ ...prev, avatarUrl: url }));
    } catch (error) {
      console.error("Failed to upload avatar", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    // 1. OPTIMISTIC UPDATE: Immediate feedback
    // We update the local UI instantly so the user feels no latency.
    const optimisticUser: User = {
      ...user,
      name: editForm.name,
      hostel: editForm.hostel,
      phone: editForm.phone,
      year: editForm.year,
      bio: editForm.bio,
      avatarUrl: editForm.avatarUrl
    };

    // Close modal immediately
    setIsEditingProfile(false);

    // Update global state immediately
    if (onProfileUpdate) {
      onProfileUpdate(optimisticUser);
    }

    // 2. BACKGROUND SYNC
    // We send the request to the DB in the background.
    try {
      await updateUserProfile(user.id, {
        name: editForm.name,
        hostel: editForm.hostel,
        phone: editForm.phone,
        year: editForm.year,
        bio: editForm.bio,
        avatarUrl: editForm.avatarUrl
      }, isDemo);
    } catch (error) {
      console.error('Failed to sync profile update', error);
      // In a robust production app, we might revert state here or show a global toast.
      // For now, console logging is sufficient as DB failure is rare compared to network latency frustration.
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Final Check: Your account will be deleted in 7 days. Continue?")) {
      try {
        await requestAccountDeletion(user.id, isDemo);
        alert("Account scheduled for deletion. Logging out.");
        onLogout();
      } catch (e) {
        alert("Failed to request deletion.");
      }
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative">

      <div className="max-w-5xl mx-auto">
        {/* Refined Back Button - Inline and Sleek */}
        {onBack && (
          <div className="mb-6">
            <a
              href="/market"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
                e.preventDefault();
                onBack();
              }}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm hover:pl-3 no-underline cursor-pointer"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              <span>Back to Market</span>
            </a>
          </div>
        )}

        {/* Redesigned Profile Card - Cover Image Style */}
        <div className="glass-panel rounded-3xl overflow-hidden mb-8 relative group animate-slide-up">

          {/* Cover Background */}
          <div className="h-32 w-full bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-500/20 relative">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.1) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>

            {/* Settings Button - Absolute Top Right */}
            <button
              onClick={() => {
                setEditForm({ name: user.name, hostel: user.hostel, phone: user.phone || '', email: user.email, year: user.year || '', bio: user.bio || '', avatarUrl: user.avatarUrl });
                setShowDangerZone(false);
                setIsEditingProfile(true);
              }}
              className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-white/30 hover:bg-white/50 dark:bg-black/30 dark:hover:bg-black/50 backdrop-blur-md text-slate-900 dark:text-white transition-all border border-white/20 shadow-sm hover:scale-105 cursor-pointer"
              title="Edit Profile"
            >
              <Settings size={20} />
            </button>
          </div>

          <div className="px-6 md:px-10 pb-8">
            <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6">

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="h-28 w-28 md:h-36 md:w-36 rounded-full p-1.5 bg-white dark:bg-slate-950 shadow-2xl">
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover border border-gray-200 dark:border-gray-800" />
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 text-center md:text-left space-y-1 min-w-0 w-full">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white truncate">{user.name}</h1>
                  {user.role === 'ADMIN' && <span className="inline-flex mx-auto md:mx-0 items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">ADMIN</span>}
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-mono text-sm truncate">{user.email}</p>

                {/* Chips */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20">
                    {user.hostel} Hostel
                  </span>
                  {user.year && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border border-cyan-100 dark:border-cyan-500/20">
                      {user.year} Year
                    </span>
                  )}
                  {currentCampus && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-100 dark:border-purple-500/20">
                      {currentCampus.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio Section */}
            {user.bio && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 text-center md:text-left">
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-2xl">{user.bio}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-4 border-b border-gray-200 dark:border-white/10 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'listings', label: 'My Listings', icon: Package },
            { id: 'donations', label: 'My Donations', icon: Gift },
            { id: 'archive', label: 'Sold / Archived', icon: Archive },
            { id: 'saved', label: 'Saved Items', icon: Heart },
            { id: 'recent', label: 'Recently Viewed', icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div>
          {items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
              {items.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onPress={onProductClick}
                  isSaved={savedIds.has(p.id)}
                  onToggleSave={(e) => { e.stopPropagation(); onToggleSave(p.id); }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-white/10">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                {activeTab === 'listings' && <Package size={48} />}
                {activeTab === 'donations' && <Gift size={48} />}
                {activeTab === 'archive' && <Archive size={48} />}
                {activeTab === 'saved' && <Heart size={48} />}
                {activeTab === 'recent' && <History size={48} />}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No {activeTab} items</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
                {activeTab === 'listings' && 'Start selling your unused items today.'}
                {activeTab === 'donations' && 'Be generous! Donate items to juniors.'}
                {activeTab === 'archive' && 'Sold or archived items will appear here.'}
                {activeTab === 'saved' && 'Items you heart will appear here.'}
                {activeTab === 'recent' && 'Items you visit will show up here.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {isEditingProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setIsEditingProfile(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <X size={20} className="text-gray-500" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Edit Profile</h2>

            {/* Avatar Upload Section */}
            <div className="flex justify-center mb-6">
              <div className="relative group cursor-pointer" onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}>
                <div className="h-24 w-24 rounded-full p-1 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg overflow-hidden">
                  <img src={editForm.avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover border-4 border-white dark:border-slate-900" />
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </div>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center z-10 cursor-not-allowed">
                    <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IITD Email</label>
                <input type="email" value={editForm.email} disabled className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-slate-900 p-2.5 text-gray-500 cursor-not-allowed" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hostel</label>
                  <select value={editForm.hostel} onChange={(e) => setEditForm({ ...editForm, hostel: e.target.value })} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white">
                    {HOSTEL_LIST.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                  <select value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white">
                    <option value="">Select...</option>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="3rd">3rd</option>
                    <option value="4th">4th</option>
                    <option value="5th+">5th+</option>
                    <option value="Faculty">Faculty</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone (Optional)</label>
                <input type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+91 99999 99999" className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio (Optional)</label>
                <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Tell us a bit about yourself..." rows={3} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white" />
              </div>
              <div className="pt-4 flex gap-3 border-t border-gray-200 dark:border-white/10">
                <Button fullWidth variant="outline" type="button" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                <Button
                  fullWidth
                  type="submit"
                  disabled={!hasChanges || isUploadingAvatar}
                >
                  {isUploadingAvatar ? 'Uploading Image...' : 'Save Changes'}
                </Button>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                <p className="text-[10px] text-gray-400 font-mono">ID: {user.email.split('@')[0]}</p>
                {!showDangerZone ? (
                  <button type="button" onClick={() => setShowDangerZone(true)} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 opacity-60 hover:opacity-100">
                    <Trash2 size={12} /> <span>Delete Account</span>
                  </button>
                ) : (
                  <div className="w-full bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-500/20 text-center animate-fade-in">
                    <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">Delete Account?</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">This will permanently delete your account in 7 days.</p>
                    <div className="flex justify-center gap-3">
                      <Button variant="ghost" size="sm" type="button" onClick={() => setShowDangerZone(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</Button>
                      <Button variant="danger" size="sm" type="button" onClick={handleDeleteAccount}>Confirm</Button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
