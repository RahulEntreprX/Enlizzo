import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, User, Report, AdminLog, SystemSettings } from '../types';
import { MOCK_PRODUCTS, MOCK_USER, CAMPUSES } from '../constants';

// --- IN-MEMORY STORE FOR DEMO MODE (Fallback) ---
const STORAGE_KEY_PRODUCTS = 'enlizzo_demo_products';
const STORAGE_KEY_REPORTS = 'enlizzo_demo_reports';
const STORAGE_KEY_USERS = 'enlizzo_demo_users';
const STORAGE_KEY_SAVED = 'enlizzo_demo_saved';
const STORAGE_KEY_RECENT = 'enlizzo_demo_recent';
const STORAGE_KEY_LOGS = 'enlizzo_demo_logs';
const STORAGE_KEY_SETTINGS = 'enlizzo_demo_settings';

// --- UTILS ---

export const generateSlug = (title: string): string => {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const shortId = Math.random().toString(36).substring(2, 6);
  return `${base}-${shortId}`;
};

export const generateLegacySlug = (title: string, id: string): string => {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  // Simple hash for demo consistency
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i) | 0;
  const suffix = Math.abs(hash).toString(36);
  return `${base}-${suffix}`;
};

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

let localProducts: Product[] = loadFromStorage(STORAGE_KEY_PRODUCTS, MOCK_PRODUCTS.map(p => ({
  ...p,
  slug: p.slug || generateLegacySlug(p.title, p.id)
})));

let localReports: Report[] = loadFromStorage(STORAGE_KEY_REPORTS, []);
let localUsers: Record<string, User> = loadFromStorage(STORAGE_KEY_USERS, { [MOCK_USER.id]: MOCK_USER });
let localSaved: Record<string, string[]> = loadFromStorage(STORAGE_KEY_SAVED, {});
let localRecent: Record<string, { id: string, at: number }[]> = loadFromStorage(STORAGE_KEY_RECENT, {});
let localLogs: AdminLog[] = loadFromStorage(STORAGE_KEY_LOGS, [
  { id: 'l1', actorId: 'system', actorName: 'System', action: 'System Startup', target: 'Server', details: 'v1.0 initialized', timestamp: new Date().toISOString(), type: 'INFO' }
]);
let localSettings: SystemSettings = loadFromStorage(STORAGE_KEY_SETTINGS, {
  priceCapPercentage: 70,
  maintenanceMode: false,
  allowNewSignups: true,
  systemNotice: ''
});

// --- MAPPING HELPERS ---

export const mapDbUserToAppUser = (dbUser: any): User => ({
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
  theme: dbUser.theme || 'dark',
  campusId: dbUser.campus_id,
  campusSlug: dbUser.campuses?.slug // Mapped from join
});

export const mapDbListingToProduct = (dbListing: any, profileMap: any): Product => ({
  id: dbListing.id,
  slug: dbListing.slug || generateLegacySlug(dbListing.title, dbListing.id),
  title: dbListing.title,
  price: isNaN(Number(dbListing.price)) ? 0 : Number(dbListing.price),
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
  likes: 0,
  isSold: dbListing.status === 'SOLD',
  status: dbListing.status,
  type: dbListing.type,
  expiresAt: dbListing.expires_at,
  campusId: dbListing.campus_id
});

// --- LISTINGS ---

export const fetchListings = async (isDemoMode: boolean) => {
  if (isDemoMode) {
    const demoCampusId = MOCK_USER.campusId || 'iitd';
    return localProducts.filter(p => p.campusId === demoCampusId);
  }

  if (!isSupabaseConfigured()) return [];

  try {
    // DB HARDENING UPDATE:
    // We no longer manually filter by campus_id.
    // Row Level Security (RLS) strictly enforces isolation.
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!listings || listings.length === 0) return [];

    const validListings = listings.filter(l => l.status !== 'FLAGGED');
    const userIds = [...new Set(validListings.map(l => l.seller_id))];

    if (userIds.length === 0) return [];

    // Profiles RLS also ensures we only fetch profiles in our campus
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
    return [];
  }
};

export const fetchProductBySlug = async (slug: string, isDemoMode: boolean): Promise<Product | null> => {
  if (isDemoMode) {
    return localProducts.find(p => p.slug === slug) || null;
  }

  if (!isSupabaseConfigured()) return null;

  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !listing) {
    // Fallback to fetch all if single query fails (rare edge case with RLS)
    const all = await fetchListings(false);
    return all.find(p => p.slug === slug) || null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', listing.seller_id)
    .single();

  const profileMap = profile ? { [profile.id]: profile } : {};
  return mapDbListingToProduct(listing, profileMap);
};

export const fetchAdminListings = async (isDemoMode: boolean) => {
  if (isDemoMode) return [...localProducts];
  if (!isSupabaseConfigured()) return [];

  // Admins might need a special RLS policy (e.g. "View All Campuses" for Super Admin)
  // For now, this respects the authenticated user's RLS context.
  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!listings) return [];

  const userIds = [...new Set(listings.map(l => l.seller_id))];
  const { data: profiles } = await supabase.from('profiles').select('id, name, hostel, email').in('id', userIds);
  const profileMap = (profiles || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});

  return listings.map(l => mapDbListingToProduct(l, profileMap));
};

export const createListing = async (
  formData: any,
  user: User,
  listingType: 'STANDARD' | 'FOREVER',
  paymentId: string,
  isDemoMode: boolean
): Promise<Product> => {

  const slug = generateSlug(formData.title);

  if (isDemoMode) {
    const newId = `p${Date.now()}`;
    const newProduct: Product = {
      id: newId,
      slug: slug,
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
      type: listingType,
      campusId: user.campusId || 'iitd'
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

  // DB HARDENING UPDATE:
  // Removed 'campus_id' from the insert payload.
  // The DB Trigger 'force_listing_campus' now strictly fetches the 
  // campus_id from the user's profile and applies it server-side.
  const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: user.id,
      slug: slug,
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
      status: 'ACTIVE'
      // campus_id is AUTO-ASSIGNED by Trigger
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    slug: data.slug || slug,
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
    expiresAt: data.expires_at,
    campusId: data.campus_id // Return the assigned campus
  };
};

export const updateListing = async (
  productId: string,
  formData: any,
  isDemoMode: boolean
): Promise<void> => {
  if (isDemoMode) {
    localProducts = localProducts.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          title: formData.title,
          description: formData.description,
          price: formData.isDonation ? 0 : Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
          category: formData.category,
          condition: formData.condition,
          images: formData.images,
        };
      }
      return p;
    });
    saveToStorage(STORAGE_KEY_PRODUCTS, localProducts);
    return;
  }

  if (!isSupabaseConfigured()) return;

  const { error } = await supabase
    .from('listings')
    .update({
      title: formData.title,
      description: formData.description,
      price: formData.isDonation ? 0 : Number(formData.price),
      original_price: formData.originalPrice ? Number(formData.originalPrice) : null,
      category: formData.category,
      condition: formData.condition,
      images: formData.images,
      is_donation: formData.isDonation,
    })
    .eq('id', productId);

  if (error) throw error;
};

export const updateListingStatus = async (id: string, status: 'SOLD' | 'ARCHIVED' | 'FLAGGED' | 'ACTIVE', isDemoMode: boolean) => {
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

// --- SAVED ITEMS ---

export const fetchSavedItems = async (userId: string, isDemoMode: boolean): Promise<Set<string>> => {
  if (isDemoMode) {
    return new Set(localSaved[userId] || []);
  }
  if (!isSupabaseConfigured()) return new Set();

  const { data, error } = await supabase
    .from('saved_items')
    .select('listing_id')
    .eq('user_id', userId);

  if (error) return new Set();
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
    const { error } = await supabase
      .from('saved_items')
      .delete()
      .match({ user_id: userId, listing_id: listingId });
    if (error) throw error;
  } else {
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

  // RLS ensures user can only insert their own history
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

// --- IMAGE UPLOAD ---
const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
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

        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return; }
          const newName = file.name.replace(/\.[^/.]+$/, ".jpg");
          const compressedFile = new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
          resolve(compressedFile);
        }, 'image/jpeg', 0.7);
      };
      img.onerror = (e) => resolve(file);
    };
    reader.onerror = (e) => resolve(file);
  });
};

export const uploadImage = async (file: File) => {
  if (!isSupabaseConfigured()) return URL.createObjectURL(file);

  let fileToUpload = file;
  try { fileToUpload = await compressImage(file); } catch (e) { }

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

// --- ADMIN FUNCTIONS ---

export const reportListing = async (listingId: string, reporterId: string, reason: string, isDemoMode: boolean) => {
  if (isDemoMode) {
    const newReport: any = { id: `r${Date.now()}`, listingId, reporterId, reason, createdAt: new Date().toISOString(), listing: {}, reporter: {} };
    localReports.push(newReport);
    saveToStorage(STORAGE_KEY_REPORTS, localReports);
    return;
  }
  if (!isSupabaseConfigured()) throw new Error("Not configured");
  const { error } = await supabase.from('reports').insert({ listing_id: listingId, reporter_id: reporterId, reason });
  if (error) throw error;
};

export const fetchReports = async (isDemoMode: boolean) => {
  if (isDemoMode) return [...localReports];
  if (!isSupabaseConfigured()) return [];
  const { data: reports, error } = await supabase
    .from('reports')
    .select(`*, listing:listings!inner(id, title, seller_id, slug), reporter:profiles(id, name, email)`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch Seller info manually (since joining listings->seller might be blocked by RLS if we are not strictly 'admin' role with bypass)
  const sellerIds = [...new Set(reports.map((r: any) => r.listing?.seller_id).filter(Boolean))];
  const { data: sellers } = await supabase.from('profiles').select('id, name, email').in('id', sellerIds);
  const sellerMap = (sellers || []).reduce((acc: any, s: any) => { acc[s.id] = s; return acc; }, {});

  return reports.map((r: any) => ({
    id: r.id,
    listingId: r.listing_id,
    reporterId: r.reporter_id,
    reason: r.reason,
    createdAt: r.created_at,
    listing: {
      id: r.listing.id,
      slug: r.listing.slug || generateLegacySlug(r.listing.title, r.listing.id),
      title: r.listing.title,
      sellerId: r.listing.seller_id,
      sellerName: sellerMap[r.listing.seller_id]?.name || 'Unknown',
      sellerEmail: sellerMap[r.listing.seller_id]?.email
    },
    reporter: { id: r.reporter?.id, name: r.reporter?.name, email: r.reporter?.email }
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
    if (localUsers[userId]) localUsers[userId].isBanned = true;
    saveToStorage(STORAGE_KEY_USERS, localUsers);
    return;
  }
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('profiles').update({ is_banned: true }).eq('id', userId);
  if (error) throw error;
};

// --- USER PROFILE ---

export const getCurrentUserProfile = async (authUser: any): Promise<User | null> => {
  const userId = authUser.id;
  if (!isSupabaseConfigured()) {
    if (userId === MOCK_USER.id) return MOCK_USER;
    return null;
  }

  // Helper to fetch profile with campus join
  const fetchProfile = async () => {
    return supabase
      .from('profiles')
      .select('*, campuses(slug)')
      .eq('id', userId)
      .single();
  };

  // 1. Try fetching existing profile
  let { data, error } = await fetchProfile();

  // 2. If missing (error code PGRST116), try to create it
  if (!data && (error?.code === 'PGRST116')) {

    // FIX: Explicitly resolve campus_id from email to ensure correct insertion
    // This replaces the reliance on the "force_listing_campus" trigger if it's failing/missing
    const email = authUser.email?.toLowerCase() || '';
    const matchedCampus = CAMPUSES.find(c => c.emailDomains.some(d => email.endsWith(d)));

    if (!matchedCampus) {
      console.error("Profile creation rejected: Email domain not supported", email);
      return null;
    }

    const newProfile = {
      id: userId,
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Student',
      avatar_url: authUser.user_metadata?.avatar_url,
      role: 'USER',
      hostel: 'Unknown',
      theme: 'dark',
      campus_id: matchedCampus.id // Explicitly assigned
    };

    // Attempt Insert
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(newProfile);

    // Race condition handling: 
    // If insert fails because it already exists (code 23505), we ignore the error 
    // and proceed to fetch the profile again.
    if (insertError && insertError.code !== '23505') {
      console.error("Failed to create profile:", insertError);
      return null;
    }

    // 3. Fetch again (works whether we just inserted OR if it existed)
    const retry = await fetchProfile();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return mapDbUserToAppUser(data);
};

export const updateUserProfile = async (userId: string, updates: any, isDemoMode: boolean): Promise<User> => {
  if (isDemoMode) {
    const current = localUsers[userId] || MOCK_USER;
    const updated = { ...current, ...updates };
    localUsers[userId] = updated;
    saveToStorage(STORAGE_KEY_USERS, localUsers);
    return updated;
  }
  if (!isSupabaseConfigured()) throw new Error("Not configured");

  // Note: We select campuses(slug) to keep the User object complete for UI state
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
    .select('*, campuses(slug)')
    .single();

  if (error) throw error;
  return mapDbUserToAppUser(data);
};

export const requestAccountDeletion = async (userId: string, isDemoMode: boolean) => {
  if (isDemoMode) return;
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('profiles').update({ deletion_requested_at: new Date().toISOString() }).eq('id', userId);
  if (error) throw error;
};

export const restoreAccount = async (userId: string, isDemoMode: boolean) => {
  if (isDemoMode) return;
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('profiles').update({ deletion_requested_at: null }).eq('id', userId);
  if (error) throw error;
}

// --- ADMIN STATS ---
export const fetchAllUsers = async (isDemoMode: boolean): Promise<User[]> => {
  if (isDemoMode) return Object.values(localUsers);
  if (!isSupabaseConfigured()) return [];
  // Admin needs to see campus slugs too if we add columns later
  const { data, error } = await supabase.from('profiles').select('*, campuses(slug)');
  if (error) throw error;
  return data.map(mapDbUserToAppUser);
};

export const fetchAdminStats = async (isDemoMode: boolean) => {
  const products = await fetchAdminListings(isDemoMode);
  const users = await fetchAllUsers(isDemoMode);
  const reports = await fetchReports(isDemoMode);
  return {
    totalUsers: users.length,
    activeProducts: products.filter(p => !p.isSold && p.status === 'ACTIVE').length,
    pendingReports: reports.length,
    totalValue: products.reduce((sum, p) => sum + (p.price || 0), 0),
    recentUsers: users.slice(0, 5)
  };
};

export const fetchSystemLogs = async (isDemoMode: boolean): Promise<AdminLog[]> => {
  if (isDemoMode) return [...localLogs];
  return [];
};

export const fetchSystemSettings = async (isDemoMode: boolean): Promise<SystemSettings> => {
  if (isDemoMode) return localSettings;
  return localSettings;
};

export const updateSystemSettings = async (settings: SystemSettings, isDemoMode: boolean) => {
  if (isDemoMode) {
    localSettings = settings;
    saveToStorage(STORAGE_KEY_SETTINGS, localSettings);
  }
};
