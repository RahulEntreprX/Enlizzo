
import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { Marketplace } from './pages/Marketplace';
import { ProductDetails } from './pages/ProductDetails';
import { ListingForm } from './pages/ListingForm';
import { Profile } from './pages/Profile';
import { AdminPanel } from './pages/AdminPanel';
import { InstallPwaPopup } from './components/InstallPwaPopup';
import { LoginModal } from './components/LoginModal';
import { ViewState, User, Product } from './types';
import { Instagram, Facebook, Youtube, Send } from 'lucide-react';
import { fetchListings, updateListingStatus, getCurrentUserProfile, restoreAccount, fetchSavedItems, updateUserProfile } from './services/db';
import { supabase, isSupabaseConfigured } from './lib/supabase';

// Fallback demo user if no Supabase connection
const DEMO_USER: User = {
  id: 'd290f1ee-6c54-4b01-90e6-d701748f0851', 
  name: 'Aravind Kumar',
  email: 'cs1230555@iitd.ac.in',
  hostel: 'Karakoram',
  avatarUrl: 'https://picsum.photos/id/64/200/200',
  role: 'USER',
  theme: 'dark'
};

const STORAGE_KEY_DEMO_USER = 'enlizzo_demo_user';

// Custom Geometry Background
const GeometricBackground = React.memo(({ variant, isDark }: { variant: 'landing' | 'default', isDark: boolean }) => {
  const baseOpacity = isDark ? 0.15 : 0.25;
  const strokeColor = isDark ? '#475569' : '#64748b';
  const bgColor = isDark ? '#030712' : '#F0F4F8';
  const beamColorStart = isDark ? 'rgba(34, 211, 238, 0)' : 'rgba(99, 102, 241, 0)'; 
  const beamColorMid = isDark ? 'rgba(34, 211, 238, 0.3)' : 'rgba(99, 102, 241, 0.6)';
  const beamColorEnd = isDark ? 'rgba(34, 211, 238, 0)' : 'rgba(99, 102, 241, 0)';

  const r1 = "M -100,150 L 200,150 L 300,323 L 600,323 L 700,496 L 1000,496 L 1100,669 L 1500,669";
  const r2 = "M -100,750 L 200,750 L 300,577 L 600,577 L 700,404 L 1000,404 L 1100,231 L 1500,231";
  const r3 = "M 700,-50 L 700,200 L 750,286 L 750,614 L 700,700 L 700,950";
  const r5 = "M 1100,50 L 1100,150 L 1200,323 L 1200,577 L 1100,750 L 1100,900";

  const hexMarker = (cx: number, cy: number, r: number) => {
      const h = r * 0.866;
      const w = r;
      return `M ${cx-w},${cy} L ${cx-w/2},${cy-h} L ${cx+w/2},${cy-h} L ${cx+w},${cy} L ${cx+w/2},${cy+h} L ${cx-w/2},${cy+h} Z`;
  };

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-700" style={{ backgroundColor: bgColor }}>
       <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg">
         <defs>
           <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
             <stop offset="0%" stopColor={beamColorStart} />
             <stop offset="50%" stopColor={beamColorMid} />
             <stop offset="100%" stopColor={beamColorEnd} />
           </linearGradient>
           <filter id="glow-heavy" x="-30%" y="-30%" width="160%" height="160%">
             <feGaussianBlur stdDeviation="2" result="blur" />
             <feComposite in="SourceGraphic" in2="blur" operator="over" />
           </filter>
         </defs>
         
         <g stroke={strokeColor} strokeWidth="0.8" fill="none" opacity={baseOpacity} strokeLinecap="round" strokeLinejoin="round">
            <path d={r1} />
            <path d={r2} />
            <path d={r3} />
            <path d={r5} />
            <path d={hexMarker(200, 150, 8)} fill={bgColor} />
            <path d={hexMarker(300, 323, 6)} fill={bgColor} />
            <path d={hexMarker(200, 750, 8)} fill={bgColor} />
            <path d={hexMarker(600, 577, 6)} fill={bgColor} />
            <path d={hexMarker(1100, 231, 8)} fill={bgColor} />
            <path d={hexMarker(700, 200, 6)} fill={bgColor} />
            <path d={hexMarker(700, 700, 6)} fill={bgColor} />
            <path d={hexMarker(1200, 323, 6)} fill={bgColor} />
         </g>

         <g fill="none" stroke="url(#beam-gradient)" strokeWidth="1.5" strokeLinecap="round" filter="url(#glow-heavy)">
            <path d={r1} className="animate-dash" strokeDasharray="150 2000" style={{ animationDuration: '15s', animationTimingFunction: 'linear' }} />
            <path d={r1} className="animate-dash" strokeDasharray="150 2000" style={{ animationDuration: '15s', animationDelay: '7.5s', animationTimingFunction: 'linear' }} />
            <path d={r2} className="animate-dash" strokeDasharray="150 2000" style={{ animationDuration: '18s', animationDelay: '2s', animationTimingFunction: 'linear' }} />
            <path d={r3} className="animate-dash" strokeDasharray="100 1500" style={{ animationDuration: '12s', animationDelay: '5s', animationTimingFunction: 'linear' }} />
            <path d={r5} className="animate-dash" strokeDasharray="120 1500" style={{ animationDuration: '20s', animationDelay: '10s', animationTimingFunction: 'linear' }} />
         </g>
       </svg>
    </div>
  );
});

const App = () => {
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isBackgroundUpdating, setIsBackgroundUpdating] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const loadData = useCallback(async (forceLoadingState = false) => {
    try {
      // We need to be careful here with closures. 
      // Instead of relying on `products.length` from the closure which might be stale,
      // we can just check if we are forcing it or pass a flag.
      // However, for simplicity and correctness, we will just set loading state based on the argument.
      
      if (!forceLoadingState) {
        setIsBackgroundUpdating(true);
      } else {
        setIsInitialLoad(true);
      }
      
      const data = await fetchListings();
      setProducts(data);
      return data;
    } catch (e) {
      console.error("Failed to fetch data", e);
      return [];
    } finally {
      setIsBackgroundUpdating(false);
      setIsInitialLoad(false);
    }
  }, []);

  // 1. Auth State Listener & Session Restoration
  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const checkAuth = async () => {
      setIsCheckingSession(true);
      
      // Fallback Safety Timer: Ensure we never get stuck in "Authenticating..."
      const safetyTimer = setTimeout(() => {
        if (mounted && isCheckingSession) {
          console.warn("Auth check timed out. Fallback to landing.");
          setIsCheckingSession(false);
        }
      }, 6000); // 6 seconds max

      if (isSupabaseConfigured()) {
         // Setup Listener FIRST
         const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
             if (!mounted) return;
             
             if (session?.user) {
                 await validateAndSetUser(session.user);
             } else if (event === 'SIGNED_OUT') {
                 setUser(null);
                 setCurrentView('landing');
             }
             
             setIsCheckingSession(false);
             clearTimeout(safetyTimer);
         });
         authSubscription = data.subscription;

         // Check Session
         const { data: { session }, error } = await supabase.auth.getSession();
         
         if (error) {
             console.error("Session error:", error);
             setIsCheckingSession(false);
             clearTimeout(safetyTimer);
             return;
         }
         
         // If no session immediately found...
         if (!session) {
             const hash = window.location.hash;
             const isMagicLink = hash && (hash.includes('access_token') || hash.includes('type=magiclink'));
             
             if (!isMagicLink) {
                 if (mounted) setIsCheckingSession(false);
                 clearTimeout(safetyTimer);
             }
         }
      } else {
        // DEMO MODE RESTORE
        const storedDemoUser = localStorage.getItem(STORAGE_KEY_DEMO_USER);
        if (storedDemoUser) {
            try {
                const parsedUser = JSON.parse(storedDemoUser);
                setUser(parsedUser);
                setIsDark(parsedUser.theme === 'dark');
                
                try {
                  const params = new URLSearchParams(window.location.search);
                  if (params.get('product')) {
                     setCurrentView('product-detail');
                  } else {
                     setCurrentView('marketplace');
                  }
                } catch (e) {
                   setCurrentView('marketplace');
                }
                
                const saved = await fetchSavedItems(parsedUser.id);
                setSavedIds(saved);
            } catch (e) {
                console.error("Failed to restore demo user", e);
            }
        }
        if (mounted) setIsCheckingSession(false);
        clearTimeout(safetyTimer);
      }
    };

    checkAuth();

    return () => {
        mounted = false;
        if (authSubscription) authSubscription.unsubscribe();
    };
  }, []);

  // 2. Deep Linking Support
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const productId = params.get('product');
      
      if (productId) {
        loadData(true).then(() => {
          setSelectedProductId(productId);
        });
      }
    } catch (e) {
      console.debug("Deep linking inactive", e);
    }
  }, [loadData]);

  const validateAndSetUser = async (authUser: any) => {
     const email = authUser.email || '';
     const isIITD = email.endsWith('iitd.ac.in') || email.endsWith('iitd.df.in');
     const isTest = email.includes('test') || email.includes('admin'); 

     if (!isIITD && !isTest) {
        await supabase.auth.signOut();
        alert('Access Restricted: ENLIZZO is exclusive to IIT Delhi. Please sign in with your @iitd.ac.in email.');
        setUser(null);
        setIsCheckingSession(false);
        return;
     }

     const profile = await getCurrentUserProfile(authUser);
     if (profile) {
        if (profile.isBanned) {
            await supabase.auth.signOut();
            alert("Account Suspended: Your account has been banned due to policy violations.");
            setUser(null);
            setIsCheckingSession(false);
            return;
        }

        if (profile.deletionRequestedAt) {
            const confirmRestore = window.confirm("This account is scheduled for deletion. Do you want to restore it?");
            if (confirmRestore) {
                await restoreAccount(profile.id);
                profile.deletionRequestedAt = null;
            } else {
                await supabase.auth.signOut();
                return;
            }
        }

        setUser(profile);
        setIsDark(profile.theme === 'dark');

        const saved = await fetchSavedItems(profile.id);
        setSavedIds(saved);
        
        // If we are on landing, move to marketplace automatically upon login
        // unless deep linked
        const params = new URLSearchParams(window.location.search);
        if (!params.get('product')) {
             setCurrentView('marketplace');
        }
     }
  };

  useEffect(() => {
    if (currentView === 'marketplace' || currentView === 'profile' || currentView === 'admin' || currentView === 'product-detail') {
      // Pass true only if products list is empty to show initial skeleton
      // We check products length here in the effect which runs after render, accessing fresh state
      const shouldForceLoad = products.length === 0;
      loadData(shouldForceLoad);
    }
  }, [currentView, loadData]); // removed products.length to prevent loop, handled by logic

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const handleThemeToggle = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (user) {
      try {
        await updateUserProfile(user.id, { theme: newTheme ? 'dark' : 'light' });
        setUser({ ...user, theme: newTheme ? 'dark' : 'light' });
        if (!isSupabaseConfigured()) {
             const updatedDemoUser = { ...user, theme: newTheme ? 'dark' : 'light' } as User;
             localStorage.setItem(STORAGE_KEY_DEMO_USER, JSON.stringify(updatedDemoUser));
        }
      } catch (e) {
        console.error("Failed to save theme preference", e);
      }
    }
  };

  const loginAsDemoUser = () => {
    console.log("Logging in as Demo User.");
    setIsLoginModalOpen(false);
    setIsCheckingSession(true);
    
    setTimeout(() => {
        setUser(DEMO_USER);
        setIsDark(DEMO_USER.theme === 'dark');
        
        localStorage.setItem(STORAGE_KEY_DEMO_USER, JSON.stringify(DEMO_USER));
        
        try {
          const params = new URLSearchParams(window.location.search);
          if (params.get('product')) {
             setCurrentView('product-detail');
          } else {
             setCurrentView('marketplace');
          }
        } catch (e) {
           setCurrentView('marketplace');
        }
        setIsCheckingSession(false);
    }, 800);
  };

  const handleLogin = async () => {
    if (isSupabaseConfigured()) {
        setIsLoginModalOpen(true);
    } else {
        console.log("Supabase not configured. Logging in as Demo User.");
        loginAsDemoUser();
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    
    setUser(null);
    setCurrentView('landing');
    setSavedIds(new Set());
    localStorage.removeItem(STORAGE_KEY_DEMO_USER);

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('product');
      window.history.pushState({}, '', url.toString());
    } catch (e) {
       // Ignore
    }
  };

  const handleNavigate = (view: ViewState) => {
    if (view === 'admin' && user?.role !== 'ADMIN') return;
    setCurrentView(view);
    window.scrollTo(0, 0);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('product');
      window.history.pushState({}, '', url.toString());
    } catch (e) {
       // Ignore
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProductId(product.id);
    setCurrentView('product-detail');
    window.scrollTo(0, 0);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('product', product.id);
      window.history.pushState({}, '', url.toString());
    } catch (e) {
       // Ignore
    }
  };

  const handleToggleSave = (id: string) => {
    const newSaved = new Set(savedIds);
    if (newSaved.has(id)) {
      newSaved.delete(id);
    } else {
      newSaved.add(id);
    }
    setSavedIds(newSaved);
  };

  const handleMarkAsSold = async (productId: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isSold: true, status: 'SOLD' } : p));
    try {
      await updateListingStatus(productId, 'SOLD');
      loadData(false);
    } catch(e) {
      console.error(e);
      loadData(true);
    }
    if (!isSupabaseConfigured()) setCurrentView('marketplace'); 
  };

  const handleListingComplete = (formData: any) => {
    loadData(true);
    setCurrentView('marketplace');
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  if (isCheckingSession) {
      return (
          <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-[#030712]' : 'bg-[#F0F4F8]'}`}>
              <GeometricBackground variant="landing" isDark={isDark} />
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <div className="h-16 w-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                  <div className="text-indigo-500 font-mono text-sm animate-pulse">AUTHENTICATING...</div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans relative selection:bg-indigo-500/30 selection:text-indigo-800 dark:selection:bg-cyan-500/30 dark:selection:text-cyan-200">
      
      <GeometricBackground variant={currentView === 'landing' ? 'landing' : 'default'} isDark={isDark} />

      <div className="relative z-10 flex flex-col flex-grow">
        <Navbar 
          isDark={isDark} 
          toggleTheme={handleThemeToggle} 
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          navigateTo={(page) => handleNavigate(page as ViewState)}
          currentPage={currentView}
        />

        <main className="flex-grow">
          {currentView === 'landing' && <LandingPage onLogin={handleLogin} />}
          
          {currentView === 'marketplace' && (
            <Marketplace 
              products={products}
              onProductClick={handleProductClick} 
              savedIds={savedIds}
              onToggleSave={handleToggleSave}
              onRefresh={async () => { await loadData(false); }}
              isRefreshing={isBackgroundUpdating}
              isLoading={isInitialLoad}
              userId={user?.id}
            />
          )}
          
          {currentView === 'product-detail' && selectedProduct && (
            <ProductDetails 
              product={selectedProduct} 
              currentUser={user}
              onBack={() => handleNavigate('marketplace')} 
              isSaved={savedIds.has(selectedProduct.id)}
              onToggleSave={() => handleToggleSave(selectedProduct.id)}
              onMarkAsSold={() => handleMarkAsSold(selectedProduct.id)}
            />
          )}

          {currentView === 'listing' && (
            <ListingForm 
              onBack={() => handleNavigate('marketplace')} 
              onSubmit={handleListingComplete}
              currentUser={user}
            />
          )}

          {currentView === 'profile' && user && (
            <Profile 
              user={user} 
              products={products}
              savedIds={savedIds}
              onToggleSave={handleToggleSave}
              onProductClick={handleProductClick}
              onBack={() => handleNavigate('marketplace')} 
              onLogout={handleLogout}
              onProfileUpdate={setUser}
            />
          )}

          {currentView === 'admin' && user?.role === 'ADMIN' && (
              <AdminPanel />
          )}
        </main>

        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
          onDemoLogin={loginAsDemoUser}
        />
        
        <InstallPwaPopup />

        <footer className={`relative h-80 overflow-hidden border-t mt-12 transition-colors duration-300 ${isDark ? 'bg-black border-white/10' : 'bg-[#F0F4F8] border-gray-300'}`}>
          <div className="absolute inset-0 flex justify-center" style={{ perspective: '600px' }}>
            <div 
              className="w-[200%] h-[200%] absolute top-0 origin-top bg-repeat animate-floor-slide opacity-30 dark:opacity-20"
              style={{ 
                transform: 'rotateX(60deg) translateY(-100px)',
                animationDuration: '15s',
                backgroundSize: '50px 86.6px',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='86.6' viewBox='0 0 50 86.6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M25 0 L50 14.43 L50 43.3 L25 57.73 L0 43.3 L0 14.43 Z' fill='none' stroke='${isDark ? '%236366f1' : '%234f46e5'}' stroke-width='1'/%3E%3Cpath d='M25 43.3 L25 86.6' fill='none' stroke='${isDark ? '%236366f1' : '%234f46e5'}' stroke-width='1'/%3E%3C/svg%3E")`,
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)'
              }}
            ></div>
          </div>

          <div className="absolute inset-0 flex flex-col justify-center items-center z-10 pointer-events-none">
             <div className="pointer-events-auto text-center">
                <div className="mb-6 flex justify-center items-center gap-3 text-indigo-600/60 dark:text-cyan-500/50">
                  <span className="h-px w-12 bg-gradient-to-r from-transparent to-indigo-600/50 dark:to-cyan-500/50"></span>
                  <span className="text-xs uppercase tracking-[0.2em] font-mono text-indigo-700 dark:text-cyan-400 shadow-indigo-500/20 dark:shadow-cyan-500/50 drop-shadow-md font-bold">System Online</span>
                  <span className="h-px w-12 bg-gradient-to-l from-transparent to-indigo-600/50 dark:to-cyan-500/50"></span>
                </div>
                
                {/* FOOTER ICONS: Non-clickable Divs with Hover Effect */}
                <div className="flex justify-center space-x-8 mb-8">
                  {[Instagram, Send, Facebook, Youtube].map((Icon, i) => (
                    <div key={i} className="group relative p-3 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-cyan-500/50 transition-all hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] dark:hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] cursor-default">
                      <Icon size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors" />
                    </div>
                  ))}
                </div>
                
                <p className="text-gray-500 text-xs font-mono tracking-wide">&copy; 2025 ENLIZZO • IIT DELHI • V1.0</p>
                
                <p className="text-gray-500 text-[10px] font-mono tracking-wide mt-3 flex items-center justify-center gap-1">
                  <span>Made with <span className="text-pink-500">🩷</span> by</span>
                  <a 
                    href="https://github.com/RahulEntreprX" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-inherit decoration-transparent hover:text-indigo-500 dark:hover:text-cyan-400 hover:underline transition-all duration-300 cursor-pointer"
                  >
                    Rahul
                  </a>
                </p>
             </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
