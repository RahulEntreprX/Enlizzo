
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, User, Report } from '../types';
import { MOCK_PRODUCTS, MOCK_USER } from '../constants';

// --- IN-MEMORY STORE FOR DEMO MODE (Fallback) ---
const STORAGE_KEY_PRODUCTS = 'enlizzo_demo_products';
const STORAGE_KEY_REPORTS = 'enlizzo_demo_reports';
const STORAGE_KEY_USERS = 'enlizzo_demo_users';
const STORAGE_KEY_SAVED = 'enlizzo_demo_saved';
const STORAGE_KEY_RECENT = 'enlizzo_demo_recent';

const loadFromStorage = (key: string, defaultData: any) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultData;
  } catch (e) {
    return defaultData;
  }
};

const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

let localProducts: Product[] = loadFromStorage(STORAGE_KEY_PRODUCTS, [...MOCK_PRODUCTS]);
let localReports: Report[] = loadFromStorage(STORAGE_KEY_REPORTS, []);
let localUsers: Record<string, User> = loadFromStorage(STORAGE_KEY_USERS, { [MOCK_USER.id]: MOCK_USER });
let localSaved: Record<string, string[]> = loadFromStorage(STORAGE_KEY_SAVED, {}); // userId -> [productId]
let localRecent: Record<string, { id: string, at: number }[]> = loadFromStorage(STORAGE_KEY_RECENT, {}); // userId -> [{id, at}]

// --- MAPPING HELPERS ---

const mapDbUserToAppUser = (dbUser: any): User => ({
  id: dbUser.id,
  name: dbUser.name || dbUser.email?.split('@')[0] || 'Student',
  email: dbUser.email,
  hostel: dbUser.hostel || 'Unknown',
  avatarUrl: dbUser.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
  phone: dbUser.phone,
  year: dbUser.year,
  bio: dbUser.bio,
  role: dbUser.role || 'USER',
  isBanned: dbUser.is_banned,
  deletionRequestedAt: dbUser.deletion_requested_at,
  theme: dbUser.theme || 'dark'
});

const mapDbListingToProduct = (dbListing: any, profileMap: any): Product => ({
  id: dbListing.id,
  title: dbListing.title,
  price: Number(dbListing.price),
  originalPrice: dbListing.original_price ? Number(dbListing.original_price) : undefined,
  description: dbListing.description,
  category: dbListing.category,
  condition: dbListing.condition,
  images: dbListing.images || [],
  sellerId: dbListing.seller_id,
  sellerName: profileMap[dbListing.seller_id]?.name || 'Unknown User',
  sellerHostel: profileMap[dbListing.seller_id]?.hostel || 'Unknown Hostel',
  sellerEmail: profileMap[dbListing.seller_id]?.email,
  sellerPhone: profileMap[dbListing.seller_id]?.phone,
  createdAt: new Date(dbListing.created_at).toLocaleDateString(),
  likes: 0, // Can be populated via count query if needed
  isSold: dbListing.status === 'SOLD',
  status: dbListing.status,
  type: dbListing.type,
  expiresAt: dbListing.expires_at
});

// --- LISTINGS ---

export const fetchListings = async (isDemoMode: boolean) => {
  // 1. Explicit Demo Mode (Strict Separation)
  if (isDemoMode) {
      return [...localProducts];
  }

  // 2. Production Mode Check
  if (!isSupabaseConfigured()) {
      // In Production phase: If not configured, return empty, NEVER return mock.
      return [];
  }

  try {
      // CRITICAL FIX: Removed .neq('status', 'FLAGGED') from SQL.
      // Postgres 'neq' excludes NULL values. Since some items might have NULL status,
      // they were disappearing. We fetch all and filter FLAGGED in JS.
      const { data: listings, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!listings || listings.length === 0) return [];

      // Client-side safety filter that allows NULLs (Legacy items) but blocks FLAGGED
      const validListings = listings.filter(l => l.status !== 'FLAGGED');

      // Fetch profiles of sellers to populate sellerName, hostel, etc.
      const userIds = [...new Set(validListings.map(l => l.seller_id))];
      
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, hostel, email, phone')
        .in('id', userIds);

      const profileMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});

      return validListings.map(l => mapDbListingToProduct(l, profileMap));
  } catch (e) {
      console.error('Fetch listings failed:', e);
      // On error in production, return empty, NEVER return localProducts.
      return []; 
  }
};

export const createListing = async (
  formData: any, 
  user: User, 
  listingType: 'STANDARD' | 'FOREVER',
  paymentId: string,
  isDemoMode: boolean
): Promise<Product> => {
  
  if (isDemoMode) {
      const newId = `p${Date.now()}`;
      const newProduct: Product = {
          id: newId,
          title: formData.title,
          description: formData.description,
          price: formData.isDonation ? 0 : Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
          category: formData.category,
          condition: formData.condition,
          images: formData.images,
          sellerId: user.id,
          sellerName: user.name,
          sellerHostel: user.hostel,
          sellerEmail: user.email,
          sellerPhone: user.phone,
          createdAt: new Date().toLocaleDateString(),
          likes: 0,
          isSold: false,
          status: 'ACTIVE',
          type: listingType
      };
      localProducts = [newProduct, ...localProducts];
      saveToStorage(STORAGE_KEY_PRODUCTS, localProducts);
      return newProduct;
  }
  
  if (!isSupabaseConfigured()) {
      throw new Error("Production Database not configured");
  }

  const expiresAt = listingType === 'STANDARD' 
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
    : null;

  const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: user.id,
      title: formData.title,
      description: formData.description,
      price: formData.isDonation ? 0 : Number(formData.price),
      original_price: formData.originalPrice ? Number(formData.originalPrice) : null,
      category: formData.category,
      condition: formData.condition,
      images: formData.images,
      type: listingType,
      is_donation: formData.isDonation,
      expires_at: expiresAt,
      payment_status: 'PAID',
      status: 'ACTIVE' // CRITICAL FIX: Explicitly set status to ACTIVE
    })
    .select()
    .single();

  if (error) throw error;

  return {
      id: data.id,
      title: data.title,
      price: Number(data.price),
      originalPrice: data.original_price ? Number(data.original_price) : undefined,
      description: data.description,
      category: data.category,
      condition: data.condition,
      images: data.images || [],
      sellerId: user.id,
      sellerName: user.name,
      sellerHostel: user.hostel,
      sellerEmail: user.email,
      sellerPhone: user.phone,
      createdAt: new Date(data.created_at).toLocaleDateString(), 
      likes: 0,
      isSold: false,
      status: 'ACTIVE',
      type: listingType,
      expiresAt: data.expires_at
  };
};

export const updateListingStatus = async (id: string, status: 'SOLD' | 'ARCHIVED' | 'FLAGGED', isDemoMode: boolean) => {
  if (isDemoMode) {
      localProducts = localProducts.map(p => 
          p.id === id ? { ...p, status, isSold: status === 'SOLD' } : p
      );
      saveToStorage(STORAGE_KEY_PRODUCTS, localProducts);
      return;
  }
  
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', id);
    
  if (error) throw error;
};

// --- SAVED ITEMS (LIKES) ---

export const fetchSavedItems = async (userId: string, isDemoMode: boolean): Promise<Set<string>> => {
    if (isDemoMode) {
        return new Set(localSaved[userId] || []);
    }

    if (!isSupabaseConfigured()) return new Set();

    const { data, error } = await supabase
        .from('saved_items')
        .select('listing_id')
        .eq('user_id', userId);

    if (error) {
        console.debug("Error fetching saved items:", error.message);
        return new Set();
    }
    
    return new Set(data?.map((item: any) => item.listing_id) || []);
};

export const toggleSavedItem = async (userId: string, listingId: string, isCurrentlySaved: boolean, isDemoMode: boolean) => {
    if (isDemoMode) {
        const current = localSaved[userId] || [];
        if (isCurrentlySaved) {
            localSaved[userId] = current.filter(id => id !== listingId);
        } else {
            localSaved[userId] = [...current, listingId];
        }
        saveToStorage(STORAGE_KEY_SAVED, localSaved);
        return;
    }

    if (!isSupabaseConfigured()) return;

    if (isCurrentlySaved) {
        // Remove
        const { error } = await supabase
            .from('saved_items')
            .delete()
            .match({ user_id: userId, listing_id: listingId });
        if (error) throw error;
    } else {
        // Add
        const { error } = await supabase
            .from('saved_items')
            .upsert({ user_id: userId, listing_id: listingId }, { onConflict: 'user_id, listing_id' });
        if (error) throw error;
    }
};

// --- RECENTLY VIEWED ---

export const addToRecentlyViewed = async (userId: string, listingId: string, isDemoMode: boolean) => {
    if (isDemoMode) {
        const userHistory = localRecent[userId] || [];
        const filtered = userHistory.filter(x => x.id !== listingId);
        filtered.unshift({ id: listingId, at: Date.now() });
        localRecent[userId] = filtered.slice(0, 20); 
        saveToStorage(STORAGE_KEY_RECENT, localRecent);
        return;
    }

    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
        .from('recently_viewed')
        .upsert({ 
            user_id: userId, 
            listing_id: listingId, 
            viewed_at: new Date().toISOString() 
        }, { onConflict: 'user_id, listing_id' });
    
    if (error) console.debug("Failed to update history:", error.message);
};

export const fetchRecentlyViewedIds = async (userId: string, isDemoMode: boolean): Promise<string[]> => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoIso = sevenDaysAgo.toISOString();

    if (isDemoMode) {
        const list = localRecent[userId] || [];
        const filtered = list.filter(item => item.at > sevenDaysAgo.getTime());
        
        if (filtered.length !== list.length) {
            localRecent[userId] = filtered;
            saveToStorage(STORAGE_KEY_RECENT, localRecent);
        }
        return filtered.map(x => x.id);
    }

    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('recently_viewed')
        .select('listing_id')
        .eq('user_id', userId)
        .gte('viewed_at', sevenDaysAgoIso)
        .order('viewed_at', { ascending: false })
        .limit(20);

    if (error) return [];
    return data?.map((r: any) => r.listing_id) || [];
};

// --- STORAGE ---

// Utility to compress images before upload
const compressImage = async (file: File): Promise<File> => {
  // If not an image, return original
  if (!file.type.startsWith('image/')) return file;
  
  // If extremely small (< 500KB), return original to save processing
  if (file.size < 500 * 1024) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }

        // Max dimensions
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG 0.7
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          // Replace extension with .jpg
          const newName = file.name.replace(/\.[^/.]+$/, ".jpg");
          const compressedFile = new File([blob], newName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.7);
      };
      img.onerror = (e) => resolve(file); // Fallback to original
    };
    reader.onerror = (e) => resolve(file); // Fallback to original
  });
};

export const uploadImage = async (file: File) => {
  // For demo mode or unconfigured environments, we just return a local URL
  // This avoids network overhead in development
  if (!isSupabaseConfigured()) {
      return URL.createObjectURL(file); 
  }

  // OPTIMIZATION: Compress image before uploading to Supabase
  let fileToUpload = file;
  try {
      fileToUpload = await compressImage(file);
  } catch (e) {
      console.warn("Image compression failed, falling back to original file", e);
  }

  const fileExt = fileToUpload.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('item-images')
    .upload(filePath, fileToUpload);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('item-images').getPublicUrl(filePath);
  return data.publicUrl;
};

// --- ADMIN & REPORTS ---

export const reportListing = async (listingId: string, reporterId: string, reason: string, isDemoMode: boolean) => {
  if (isDemoMode) {
      const newReport: any = {
        id: `r${Date.now()}`,
        listingId,
        reporterId,
        reason,
        createdAt: new Date().toISOString(),
        listing: localProducts.find(p => p.id === listingId) || {},
        reporter: localUsers[reporterId] || {}
      };
      localReports.push(newReport);
      saveToStorage(STORAGE_KEY_REPORTS, localReports);
      return;
  }

  if (!isSupabaseConfigured()) throw new Error("Not configured");

  const { error } = await supabase
    .from('reports')
    .insert({ listing_id: listingId, reporter_id: reporterId, reason });
  
  if (error) throw error;
};

export const fetchReports = async (isDemoMode: boolean) => {
  if (isDemoMode) return [...localReports];
  
  if (!isSupabaseConfigured()) return [];

  const { data: reports, error } = await supabase
    .from('reports')
    .select(`
      *,
      listing:listings!inner(id, title, seller_id),
      reporter:profiles(id, name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const sellerIds = [...new Set(reports.map((r: any) => r.listing?.seller_id).filter(Boolean))];
  const { data: sellers } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', sellerIds);

  const sellerMap = (sellers || []).reduce((acc: any, s: any) => {
    acc[s.id] = s;
    return acc;
  }, {});

  return reports.map((r: any) => ({
    id: r.id,
    listingId: r.listing_id,
    reporterId: r.reporter_id,
    reason: r.reason,
    createdAt: r.created_at,
    listing: {
        id: r.listing.id,
        title: r.listing.title,
        sellerId: r.listing.seller_id,
        sellerName: sellerMap[r.listing.seller_id]?.name || 'Unknown',
        sellerEmail: sellerMap[r.listing.seller_id]?.email
    },
    reporter: {
        id: r.reporter?.id,
        name: r.reporter?.name,
        email: r.reporter?.email
    }
  })) as Report[];
};

export const dismissReport = async (reportId: string, isDemoMode: boolean) => {
  if (isDemoMode) {
      localReports = localReports.filter(r => r.id !== reportId);
      saveToStorage(STORAGE_KEY_REPORTS, localReports);
      return;
  }
  
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase.from('reports').delete().eq('id', reportId);
  if (error) throw error;
};

export const deleteListing = async (listingId: string, isDemoMode: boolean) => {
    if (isDemoMode) {
        localProducts = localProducts.filter(p => p.id !== listingId);
        saveToStorage(STORAGE_KEY_PRODUCTS, localProducts);
        return;
    }
    
    if (!isSupabaseConfigured()) return;

    await supabase.from('reports').delete().eq('listing_id', listingId);
    const { error } = await supabase.from('listings').delete().eq('id', listingId);
    if (error) throw error;
}

export const banUser = async (userId: string, isDemoMode: boolean) => {
    if (isDemoMode) {
        if (localUsers[userId]) {
            localUsers[userId].isBanned = true;
            saveToStorage(STORAGE_KEY_USERS, localUsers);
        }
        return;
    }
    
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
        .from('profiles')
        .update({ is_banned: true })
        .eq('id', userId);
    if (error) throw error;
};

// --- AUTH & PROFILE ---

export const getCurrentUserProfile = async (authUser: any): Promise<User | null> => {
  const userId = authUser.id;
  
  if (!isSupabaseConfigured()) {
      // Even if not configured, we only return MOCK_USER if explicitly requested via AuthContext demo flow.
      // However, AuthContext handles the mock flow logic. 
      // If we are here with a userId that matches mock, we return mock.
      if (userId === MOCK_USER.id) return MOCK_USER;
      // Otherwise return null (no real users in no-config mode)
      return null;
  }

  // Try to get existing profile
  let { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  // LAZY CREATION: If profile doesn't exist (no trigger setup), create it now
  if (!data && (error?.code === 'PGRST116' || error?.message?.includes('JSON'))) {
     const newProfile = {
        id: userId,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Student',
        avatar_url: authUser.user_metadata?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        role: 'USER',
        hostel: 'Unknown',
        theme: 'dark'
     };
     
     const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();
        
     if (createError) {
         console.error("Failed to create profile:", createError);
         return { 
            id: newProfile.id,
            name: newProfile.name,
            email: newProfile.email,
            hostel: newProfile.hostel,
            avatarUrl: newProfile.avatar_url,
            role: 'USER',
            isBanned: false, 
            deletionRequestedAt: null,
            theme: 'dark'
         };
     }
     data = createdProfile;
  } else if (error) {
      console.error("Error fetching profile:", error);
      return null;
  }
  
  return mapDbUserToAppUser(data);
};

export const updateUserProfile = async (userId: string, updates: { 
    name?: string; 
    hostel?: string; 
    phone?: string;
    year?: string;
    bio?: string;
    theme?: 'dark' | 'light';
    avatarUrl?: string;
}, isDemoMode: boolean): Promise<User> => {
  if (isDemoMode) {
      const current = localUsers[userId] || MOCK_USER;
      const updated = { ...current, ...updates };
      localUsers[userId] = updated;
      saveToStorage(STORAGE_KEY_USERS, localUsers);
      return updated;
  }

  if (!isSupabaseConfigured()) throw new Error("Not configured");

  const { data, error } = await supabase
    .from('profiles')
    .update({
        name: updates.name,
        hostel: updates.hostel,
        phone: updates.phone,
        year: updates.year,
        bio: updates.bio,
        theme: updates.theme,
        avatar_url: updates.avatarUrl
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapDbUserToAppUser(data);
};

export const requestAccountDeletion = async (userId: string, isDemoMode: boolean) => {
    if (isDemoMode) return;
    
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
        .from('profiles')
        .update({ deletion_requested_at: new Date().toISOString() })
        .eq('id', userId);
    if (error) throw error;
};

export const restoreAccount = async (userId: string, isDemoMode: boolean) => {
    if (isDemoMode) return;

    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
        .from('profiles')
        .update({ deletion_requested_at: null })
        .eq('id', userId);
    if (error) throw error;
}
