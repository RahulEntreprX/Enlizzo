

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Product } from '../types';
import { HOSTELS } from '../constants';
import { ProductCard } from '../components/ProductCard';
import { Settings, Package, Heart, Gift, X, ArrowLeft, Trash2, History, Camera } from 'lucide-react';
import { Button } from '../components/Button';
import { updateUserProfile, requestAccountDeletion, fetchRecentlyViewedIds, uploadImage } from '../services/db';

interface ProfileProps {
  user: User;
  products: Product[];
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  onProductClick: (product: Product) => void;
  onBack?: () => void;
  onLogout: () => void;
  onProfileUpdate?: (updatedUser: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ 
  user, 
  products, 
  savedIds, 
  onToggleSave, 
  onProductClick, 
  onBack, 
  onLogout,
  onProfileUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'donations' | 'saved' | 'recent'>('listings');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  useEffect(() => {
    fetchRecentlyViewedIds(user.id).then(setRecentlyViewedIds);
  }, [user.id]);

  const items = useMemo(() => {
      return products.filter(p => {
        if (activeTab === 'listings') return p.sellerId === user.id && p.price > 0;
        if (activeTab === 'donations') return p.sellerId === user.id && p.price === 0;
        if (activeTab === 'saved') return savedIds.has(p.id);
        if (activeTab === 'recent') return recentlyViewedIds.includes(p.id);
        return false;
      });
  }, [activeTab, products, user.id, savedIds, recentlyViewedIds]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Preview immediately (optional, but good UX)
    // const previewUrl = URL.createObjectURL(file);
    // setEditForm(prev => ({ ...prev, avatarUrl: previewUrl }));

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
    setIsSaving(true);
    try {
      const updatedUser = await updateUserProfile(user.id, {
        name: editForm.name,
        hostel: editForm.hostel,
        phone: editForm.phone,
        year: editForm.year,
        bio: editForm.bio,
        avatarUrl: editForm.avatarUrl
      });
      if (onProfileUpdate) {
        onProfileUpdate(updatedUser);
      }
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Final Check: Your account will be deleted in 7 days. Continue?")) {
        try {
            await requestAccountDeletion(user.id);
            alert("Account scheduled for deletion. Logging out.");
            onLogout();
        } catch (e) {
            alert("Failed to request deletion.");
        }
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative">
      {onBack && (
         <button onClick={onBack} className="fixed top-20 left-4 md:left-8 z-30 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-lg transition-all hover:-translate-x-1">
          <ArrowLeft size={24} />
        </button>
      )}

      <div className="max-w-6xl mx-auto pt-8">
        <div className="glass-panel rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-start gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative flex-shrink-0 mx-auto md:mx-0">
            <div className="h-32 w-32 rounded-full p-1 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover border-4 border-white dark:border-slate-900" />
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1 z-10">
            <div className="flex flex-col md:flex-row justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{user.name}</h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">{user.email}</p>
                    {user.bio && <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 max-w-md">{user.bio}</p>}
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">{user.hostel} Hostel</span>
                        {user.year && <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">{user.year} Year</span>}
                        {user.phone && <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{user.phone}</span>}
                    </div>
                </div>
                <button 
                    onClick={() => {
                        setEditForm({ name: user.name, hostel: user.hostel, phone: user.phone || '', email: user.email, year: user.year || '', bio: user.bio || '', avatarUrl: user.avatarUrl });
                        setShowDangerZone(false);
                        setIsEditingProfile(true);
                    }}
                    className="p-3 rounded-xl bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 shadow-sm z-10"
                >
                    <Settings size={24} />
                </button>
            </div>
          </div>
        </div>

        <div className="flex space-x-4 border-b border-gray-200 dark:border-white/10 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'listings', label: 'My Listings', icon: Package },
            { id: 'donations', label: 'My Donations', icon: Gift },
            { id: 'saved', label: 'Saved Items', icon: Heart },
            { id: 'recent', label: 'Recently Viewed', icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
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
                {activeTab === 'saved' && <Heart size={48} />}
                {activeTab === 'recent' && <History size={48} />}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No {activeTab} items</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
                {activeTab === 'listings' && 'Start selling your unused items today.'}
                {activeTab === 'donations' && 'Be generous! Donate items to juniors.'}
                {activeTab === 'saved' && 'Items you heart will appear here.'}
                {activeTab === 'recent' && 'Items you visit will show up here.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setIsEditingProfile(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Edit Profile</h2>
            
            {/* Avatar Upload Section */}
            <div className="flex justify-center mb-6">
               <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="h-24 w-24 rounded-full p-1 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg overflow-hidden">
                      <img src={editForm.avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover border-4 border-white dark:border-slate-900" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white" size={24} />
                  </div>
                  {isUploadingAvatar && (
                      <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center z-10">
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
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IITD Email</label>
                <input type="email" value={editForm.email} disabled className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-slate-900 p-2.5 text-gray-500 cursor-not-allowed" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hostel</label>
                    <select value={editForm.hostel} onChange={(e) => setEditForm({...editForm, hostel: e.target.value})} className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white">
                    {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                    <select value={editForm.year} onChange={(e) => setEditForm({...editForm, year: e.target.value})} className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white">
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
                <input type="tel" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} placeholder="+91 99999 99999" className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio (Optional)</label>
                <textarea value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} placeholder="Tell us a bit about yourself..." rows={3} className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white" />
              </div>
              <div className="pt-4 flex gap-3 border-t border-gray-200 dark:border-white/10">
                <Button fullWidth variant="outline" type="button" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                <Button fullWidth type="submit" isLoading={isSaving}>Save Changes</Button>
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
