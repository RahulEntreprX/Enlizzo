
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getCurrentUserProfile, restoreAccount } from '../services/db';
import { User } from '../types';
import { MOCK_USER, CAMPUSES } from '../constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginAsDemo: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
  currentCampus: typeof CAMPUSES[0] | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginAsDemo: () => { },
  logout: async () => { },
  refreshUser: async () => { },
  updateUser: () => { },
  currentCampus: null,
});

export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY_DEMO_USER = 'enlizzo_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCampus, setCurrentCampus] = useState<typeof CAMPUSES[0] | null>(null);

  // Look up full campus object based on DB Slug (preferred), ID, or Email Domain fallback
  const resolveCampus = (profile: User) => {
    // 1. Try slug match (Most reliable if DB join worked)
    if (profile.campusSlug) {
      const match = CAMPUSES.find(c => c.slug === profile.campusSlug);
      if (match) return match;
    }

    // 2. Try ID match (Fallback for Demo/Legacy where ID is string 'iitd')
    if (profile.campusId) {
      const match = CAMPUSES.find(c => c.id === profile.campusId);
      if (match) return match;
    }

    // 3. Fallback: Match by Email Domain (Resilience against DB join failures)
    if (profile.email) {
      const domain = profile.email.split('@')[1];
      if (domain) {
        const match = CAMPUSES.find(c => c.emailDomains.some(d => d.includes(domain) || domain.includes(d.replace('@', ''))));
        if (match) return match;
      }
    }

    return null;
  };

  const validateAndSetUser = async (authUser: any) => {
    try {
      // Fetch full profile from DB
      const profile = await getCurrentUserProfile(authUser);

      if (profile) {
        const dbCampus = resolveCampus(profile);

        if (!dbCampus) {
          console.error("CRITICAL: User has no recognized campus configuration", profile);
          // We do NOT sign out here to avoid aggressive loops. 
          // Just return null, app will handle empty state or redirect to landing.
          return null;
        }

        setCurrentCampus(dbCampus);

        if (profile.isBanned) {
          await supabase.auth.signOut();
          alert("Account Suspended.");
          return null;
        }

        if (profile.deletionRequestedAt) {
          const confirmRestore = window.confirm("This account is scheduled for deletion. Restore?");
          if (confirmRestore) {
            await restoreAccount(profile.id, false);
            profile.deletionRequestedAt = null;
          } else {
            await supabase.auth.signOut();
            return null;
          }
        }
        return profile;
      } else {
        // Profile creation failed or fetch returned null
        const email = authUser.email || authUser.user_metadata?.email || 'Unknown';
        console.warn(`Validation Failed for ${email}. Profile is null. Retrying on next load.`);
        // Do NOT sign out. Let the session persist so next refresh might work.
        return null;
      }
    } catch (error) {
      console.error("User validation failed", error);
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    const initAuth = async () => {
      // Safety timeout to prevent infinite loading screen
      const safetyTimeout = setTimeout(() => {
        if (mounted && loading) {
          console.warn("Auth initialization timed out - forcing app load");
          setLoading(false);
        }
      }, 5000); // Increased to 5s to allow for profile retries

      if (!isSupabaseConfigured()) {
        const stored = localStorage.getItem(STORAGE_KEY_DEMO_USER);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (mounted) {
              setUser(parsed);
              const demoCampus = CAMPUSES.find(c => c.id === parsed.campusId) || CAMPUSES[0];
              setCurrentCampus(demoCampus);
            }
          } catch (e) {
            console.error(e);
          }
        }
        clearTimeout(safetyTimeout);
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("Session check warning:", error.message);
        }

        if (session?.user && mounted) {
          const profile = await validateAndSetUser(session.user);
          if (mounted && profile) setUser(profile);
        }

        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;

          if (event === 'SIGNED_IN' && session?.user) {
            const profile = await validateAndSetUser(session.user);
            if (mounted) setUser(profile);
          } else if (event === 'SIGNED_OUT') {
            if (mounted) {
              setUser(null);
              setCurrentCampus(null);
            }
          }
        });
        authListener = data;

      } catch (error) {
        console.error("Auth init failed:", error);
      } finally {
        clearTimeout(safetyTimeout);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, []);

  const loginAsDemo = () => {
    setUser(MOCK_USER);
    // In demo mode, we just grab the default campus by ID
    const demoCampus = CAMPUSES.find(c => c.id === MOCK_USER.campusId) || CAMPUSES[0];
    setCurrentCampus(demoCampus);
    localStorage.setItem(STORAGE_KEY_DEMO_USER, JSON.stringify(MOCK_USER));
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error("Logout error", e);
    }
    localStorage.removeItem(STORAGE_KEY_DEMO_USER);
    setUser(null);
    setCurrentCampus(null);

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('product');
      window.history.pushState({}, '', url.toString());
    } catch (e) { }
  };

  const refreshUser = async () => {
    if (!user) return;
    if (isSupabaseConfigured()) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const profile = await getCurrentUserProfile(authUser);
        if (profile) setUser(profile);
      }
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginAsDemo, logout, refreshUser, updateUser, currentCampus }}>
      {children}
    </AuthContext.Provider>
  );
};
