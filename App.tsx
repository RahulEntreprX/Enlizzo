import React, { useState, useEffect, memo, useRef, useLayoutEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { Marketplace } from './pages/Marketplace';
import { ProductDetails } from './pages/ProductDetails';
import { ListingForm } from './pages/ListingForm';
import { Profile } from './pages/Profile';
import { AdminPanel } from './pages/admin';
import { InstallPwaPopup } from './components/InstallPwaPopup';
import { LoginModal } from './components/LoginModal';
import { ViewState, Product, User } from './types';
import { Instagram, Facebook, Youtube, Send } from 'lucide-react';
import { updateListingStatus, fetchSavedItems, updateUserProfile, toggleSavedItem } from './services/db';
import { isSupabaseConfigured } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import { MOCK_USER } from './constants';
import { useRealtimeListings } from './hooks/useRealtimeListings';


// FIXED VERSION – ALL POINTER EVENTS DISABLED FOR BACKGROUND AND SVG

const GeometricBackground = memo(({ variant, isDark }: { variant: 'landing' | 'default', isDark: boolean }) => {
  const baseOpacity = isDark ? 0.15 : 0.15;
  const strokeColor = isDark ? '#64748b' : '#64748b';
  const bgColor = isDark ? '#030712' : '#F0F4F8';
  
  // Adjusted Intensity: Thin and elegant, reduced opacity (requested: visible but not intense)
  const beamColorStart = isDark ? 'rgba(34, 211, 238, 0)' : 'rgba(99, 102, 241, 0)'; 
  const beamColorMid = isDark ? 'rgba(34, 211, 238, 0.5)' : 'rgba(99, 102, 241, 0.7)'; // Reduced peak opacity: 0.5/0.7
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
    <div 
      className="fixed inset-0 z-0 overflow-hidden transition-colors duration-700 pointer-events-none"
      style={{ backgroundColor: bgColor }}
    >
       <svg 
         className="absolute inset-0 w-full h-full pointer-events-none"
         preserveAspectRatio="xMidYMid slice" 
         viewBox="0 0 1400 900" 
         xmlns="http://www.w3.org/2000/svg"
       >
         <defs>
           <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
             <stop offset="0%" stopColor={beamColorStart} />
             <stop offset="50%" stopColor={beamColorMid} />
             <stop offset="100%" stopColor={beamColorEnd} />
           </linearGradient>
         </defs>
         
         <g 
           stroke={strokeColor} 
           strokeWidth="1" 
           fill="none" 
           opacity={baseOpacity} 
           strokeLinecap="round" 
           strokeLinejoin="round"
           className="pointer-events-none"
         >
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

         <g 
           fill="none" 
           stroke="url(#beam-gradient)" 
           strokeWidth="1" 
           strokeLinecap="round" 
           style={{ filter: 'blur(0px)' }} 
           className="pointer-events-none"
         >
            {/* Increased dash array length (300) for longer "busses" */}
            <path d={r1} className="animate-dash" strokeDasharray="300 2000" style={{ animationDuration: '15s', animationTimingFunction: 'linear' }} />
            <path d={r1} className="animate-dash" strokeDasharray="300 2000" style={{ animationDuration: '15s', animationDelay: '7.5s', animationTimingFunction: 'linear' }} />
            <path d={r2} className="animate-dash" strokeDasharray="300 2000" style={{ animationDuration: '18s', animationDelay: '2s', animationTimingFunction: 'linear' }} />
            <path d={r3} className="animate-dash" strokeDasharray="200 1500" style={{ animationDuration: '12s', animationDelay: '5s', animationTimingFunction: 'linear' }} />
            <path d={r5} className="animate-dash" strokeDasharray="240 1500" style={{ animationDuration: '20s', animationDelay: '10s', animationTimingFunction: 'linear' }} />
         </g>
       </svg>
    </div>
  );
});


const App = () => {
  const { user, loading: authLoading, loginAsDemo, logout, updateUser } = useAuth();
  
  const [isDark, setIsDark] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Check if user is in Demo mode (Strictly limited to the specific Mock User)
  const isDemo = user?.id === MOCK_USER.id;

  // Realtime Listings Hook
  const { products, loading: productsLoading, refresh: refreshProducts } = useRealtimeListings(user?.campusId, isDemo);

  // Scroll Restoration Ref
  const scrollPositions = useRef<Record<string, number>>({});

  // Update theme based on user preference
  useEffect(() => {
    if (user?.theme) {
      setIsDark(user.theme === 'dark');
    }
  }, [user]);


  // ==========================================
  // ROUTING LOGIC (CLEAN URLS)
  // ==========================================

  // 1. Handle Scroll Restoration
  useLayoutEffect(() => {
    const savedPosition = scrollPositions.current[currentView];
    window.scrollTo(0, savedPosition || 0);
  }, [currentView]);

  // 2. Handle Initial URL Load and PopState (Browser Back/Forward)
  useEffect(() => {
    const handleUrlSync = () => {
       const path = window.location.pathname;
       const hash = window.location.hash;

       // Sync Modal
       if (hash === '#login') setIsLoginModalOpen(true);
       else setIsLoginModalOpen(false);

       // Clean Path Routing
       if (path === '/' || path === '/landing') {
           setCurrentView('landing');
       } else if (path === '/market' || path === '/marketplace') {
           setCurrentView('marketplace');
       } else if (path === '/sell' || path === '/listing') {
           setCurrentView('listing');
       } else if (path === '/profile') {
           setCurrentView('profile');
       } else if (path === '/admin') {
           setCurrentView('admin');
       } else if (path.startsWith('/product/') || path.startsWith('/p/')) {
           // Extract Slug
           const parts = path.split('/');
           const slug = parts[parts.length - 1];
           if (slug) {
               setSelectedProductSlug(slug);
               setCurrentView('product-detail');
           } else {
               setCurrentView('marketplace');
           }
       } else {
           // Default logic after auth logic handles redirects, 
           // but initial load relies on URL mostly.
           if (path === '/') setCurrentView('landing');
       }
    };

    // Initial check
    handleUrlSync();

    // Listen for back button
    window.addEventListener('popstate', handleUrlSync);
    return () => window.removeEventListener('popstate', handleUrlSync);
  }, []); // Only run once on mount to parse URL

  // 3. Handle Legacy Redirects (After products load)
  useEffect(() => {
    if (products.length > 0) {
       const params = new URLSearchParams(window.location.search);
       
       // Handle ?product=UUID
       if (params.has('product')) {
          const id = params.get('product');
          const product = products.find(p => p.id === id);
          if (product) {
             const newPath = `/product/${product.slug || product.id}`;
             // Use replaceState to overwrite the legacy URL in history
             window.history.replaceState({}, '', newPath);
             setSelectedProductSlug(product.slug || product.id);
             setCurrentView('product-detail');
             return;
          }
       }

       // Handle ?page=market
       if (params.has('page')) {
          const page = params.get('page');
          if (page === 'marketplace' || page === 'market') {
             window.history.replaceState({}, '', '/market');
             setCurrentView('marketplace');
          }
       }
    }
  }, [products]);

  // 4. Handle Auth-based Redirection
  useEffect(() => {
    // CRITICAL: Do not redirect while auth is still loading to prevent flash
    if (authLoading) return;

    const protectedViews: ViewState[] = ['marketplace', 'listing', 'profile', 'admin'];
    const path = window.location.pathname;

    if (user && currentView === 'landing' && path === '/') {
        handleNavigate('marketplace');
    } else if (!user && protectedViews.includes(currentView)) {
        // If Logged Out and on a protected view, force redirect to Landing
        handleNavigate('landing');
    }
  }, [user, currentView, authLoading]);


  // Fetch User Data (Saved Items)
  useEffect(() => {
    if (user) {
      fetchSavedItems(user.id, isDemo).then(setSavedIds);
    } else {
      setSavedIds(new Set());
    }
  }, [user, isDemo]);

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
      updateUserProfile(user.id, { theme: newTheme ? 'dark' : 'light' }, isDemo).catch(console.error);
    }
  };

  const handleLoginClick = () => {
    if (isSupabaseConfigured()) {
        try {
          window.history.pushState(null, '', '#login');
        } catch (e) {
          console.warn('Failed to push login hash state', e);
        }
        setIsLoginModalOpen(true);
    } else {
        loginAsDemo();
    }
  };

  const handleCloseLoginModal = () => {
    if (window.location.hash === '#login') {
       try {
         window.history.back();
       } catch (e) {
         console.warn('Failed to go back in history', e);
         setIsLoginModalOpen(false);
       }
    } else {
       setIsLoginModalOpen(false);
    }
  };

  const handleDemoLogin = () => {
    handleCloseLoginModal();
    loginAsDemo();
  };

  const handleNavigate = (view: ViewState, scrollToTop: boolean = false) => {
    if (view === 'admin' && user?.role !== 'ADMIN') return;

    // Save current scroll position before navigation
    scrollPositions.current[currentView] = window.scrollY;

    // Reset scroll for target view if requested (e.g. Logo click)
    if (scrollToTop) {
        scrollPositions.current[view] = 0;
    }

    // URL MAPPING LOGIC
    let path = '/';
    if (view === 'marketplace') path = '/market';
    else if (view === 'listing') path = '/sell';
    else if (view === 'profile') path = '/profile';
    else if (view === 'admin') path = '/admin';
    else if (view === 'landing') path = '/';

    try {
      window.history.pushState({}, '', path);
    } catch (e) {
      console.warn('Navigation URL update failed', e);
    }

    // Clear edit state if navigating away from listing unless explicitly keeping it (not handled here)
    if (view !== 'listing') {
        setProductToEdit(null);
    }

    setCurrentView(view);
    setSelectedProductSlug(null);
  };

  const handleLogout = async () => {
      handleNavigate('landing');
      await logout();
  };

  const handleProductClick = (product: Product) => {
    scrollPositions.current[currentView] = window.scrollY;

    const slug = product.slug || product.id; // Safe fallback
    try {
      window.history.pushState({}, '', `/product/${slug}`);
    } catch (e) {
      console.warn('Product URL update failed', e);
    }

    setSelectedProductSlug(slug);
    setCurrentView('product-detail');
  };

  const handleEditProduct = (product: Product) => {
      setProductToEdit(product);
      handleNavigate('listing');
  };

  const handleToggleSave = (id: string) => {
    if (!user) return;
    const wasSaved = savedIds.has(id);
    const newSaved = new Set(savedIds);
    if (wasSaved) {
      newSaved.delete(id);
    } else {
      newSaved.add(id);
    }
    setSavedIds(newSaved);
    toggleSavedItem(user.id, id, wasSaved, isDemo).catch(err => {
       console.error("Failed to sync save state", err);
    });
  };

  const handleMarkAsSold = async (productId: string, newStatus: 'SOLD' | 'ACTIVE') => {
    // Optimistic update handled by hook via re-fetch or realtime, but for instant UI feedback we can manually mutate
    // However, since we use the hook's state, we should rely on the DB update. 
    // Ideally we would update the local state here too, but the hook manages 'products'.
    // We can just call the DB function and let realtime handle the rest.
    updateListingStatus(productId, newStatus, isDemo).catch(console.error);
  };

  const handleListingComplete = async (newProduct: Product) => {
    // Logic handled by realtime subscription now, but we can navigate immediately
    handleNavigate('marketplace');
  };
  
  const handleProfileUpdate = (updatedUser: User) => {
    updateUser(updatedUser);
    // Trigger a refresh of listings to ensure the user's new avatar/name appears on their cards immediately
    refreshProducts(); 
  };

  // Resolve Product from Slug (Checking both slug field and ID for backward compatibility during resolution)
  const selectedProduct = products.find(p => p.slug === selectedProductSlug) || products.find(p => p.id === selectedProductSlug);

  // Loading Spinner Component for Content Areas
  const ContentLoader = () => (
     <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
     </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans relative selection:bg-indigo-500/30 selection:text-indigo-800 dark:selection:bg-cyan-500/30 dark:selection:text-cyan-200">
      
      <GeometricBackground variant={currentView === 'landing' ? 'landing' : 'default'} isDark={isDark} />

      <div className="relative z-10 flex flex-col flex-grow">
        <Navbar 
          isDark={isDark} 
          toggleTheme={handleThemeToggle} 
          user={user}
          onLogin={handleLoginClick}
          onLogout={handleLogout}
          navigateTo={handleNavigate}
          currentPage={currentView}
          isLoading={authLoading}
        />

        <main className="flex-grow relative">
          <div key={currentView} className="animate-fade-in w-full h-full">
            {currentView === 'landing' && <LandingPage onLogin={handleLoginClick} />}
            
            {currentView === 'marketplace' && (
              <Marketplace 
                products={products}
                onProductClick={handleProductClick} 
                savedIds={savedIds}
                onToggleSave={handleToggleSave}
                onRefresh={async () => { await refreshProducts(); }}
                isRefreshing={productsLoading}
                isLoading={productsLoading || authLoading}
                userId={user?.id}
                isDemo={isDemo}
                onSellClick={() => handleNavigate('listing')}
              />
            )}
            
            {currentView === 'product-detail' && (
              selectedProduct ? (
                <ProductDetails 
                  product={selectedProduct} 
                  currentUser={user}
                  onBack={() => handleNavigate('marketplace')} 
                  isSaved={savedIds.has(selectedProduct.id)}
                  onToggleSave={() => handleToggleSave(selectedProduct.id)}
                  onMarkAsSold={(newStatus) => handleMarkAsSold(selectedProduct.id, newStatus)}
                  isDemo={isDemo}
                  onEdit={handleEditProduct}
                />
              ) : (
                <div className="flex items-center justify-center min-h-[50vh]">
                   <div className="flex flex-col items-center gap-4">
                      {productsLoading ? (
                        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                      ) : (
                        <>
                          <div className="text-4xl">🔍</div>
                          <p className="text-gray-500 text-sm font-mono animate-pulse">Item not found</p>
                          <a 
                             href="/market"
                             onClick={(e) => {
                               e.preventDefault();
                               handleNavigate('marketplace');
                             }}
                             className="text-indigo-500 hover:underline cursor-pointer"
                           >
                             Return to Marketplace
                           </a>
                        </>
                      )}
                   </div>
                </div>
              )
            )}

            {currentView === 'listing' && (
              authLoading ? <ContentLoader /> :
              <ListingForm 
                onBack={() => handleNavigate('marketplace')} 
                onSubmit={handleListingComplete}
                currentUser={user}
                isDemo={isDemo}
                editProduct={productToEdit}
              />
            )}

            {currentView === 'profile' && (
              authLoading ? <ContentLoader /> :
              user ? (
                <Profile 
                    user={user} 
                    products={products}
                    savedIds={savedIds}
                    onToggleSave={handleToggleSave}
                    onProductClick={handleProductClick}
                    onBack={() => handleNavigate('marketplace')} 
                    onLogout={handleLogout}
                    onProfileUpdate={handleProfileUpdate}
                    isDemo={isDemo}
                />
              ) : <ContentLoader /> // Fallback if redirected logic hasn't kicked in yet
            )}

            {currentView === 'admin' && (
                authLoading ? <ContentLoader /> :
                user?.role === 'ADMIN' ? <AdminPanel isDemo={isDemo} /> : null
            )}
          </div>
        </main>

        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={handleCloseLoginModal} 
          onDemoLogin={handleDemoLogin}
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