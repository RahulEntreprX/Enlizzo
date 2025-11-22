
import React from 'react';
import { flushSync } from 'react-dom';
import { Moon, Sun, ShoppingBag, LogOut, ShieldCheck, ArrowRight, PlusCircle, User, Settings, Home } from 'lucide-react';
import { User as UserType } from '../types';
import { Button } from './Button';

interface NavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
  user: UserType | null;
  onLogin: () => void;
  onLogout: () => void;
  navigateTo: (page: string, scrollToTop?: boolean) => void;
  currentPage: string;
  isLoading?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  isDark, 
  toggleTheme, 
  user, 
  onLogin, 
  onLogout,
  navigateTo,
  currentPage,
  isLoading = false
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node) && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close menu when route changes
  React.useEffect(() => {
      setIsMenuOpen(false);
  }, [currentPage]);

  const handleLinkClick = (e: React.MouseEvent, page: string) => {
    // Allow ctrl/cmd/shift clicks to open in new tab
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
        return; 
    }
    e.preventDefault();
    navigateTo(page);
  };

  // Custom Slow Natural Scroll
  const smoothScrollToTop = () => {
    const startPosition = window.scrollY;
    // If we are already near top, just snap or do a short scroll
    if (startPosition < 50) {
       window.scrollTo({ top: 0, behavior: 'smooth' });
       return;
    }

    const duration = 2000; // 2.0s duration for "Slow Auto Scroll" feel
    const startTime = performance.now();

    // Easing: easeInOutCubic for a very natural acceleration/deceleration
    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const ease = easeInOutCubic(progress);
      window.scrollTo(0, startPosition * (1 - ease));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
        return; 
    }
    e.preventDefault();
    
    const targetPage = user ? 'marketplace' : 'landing';

    if (currentPage === targetPage) {
      smoothScrollToTop();
    } else {
      // If navigating to default page, force scroll to top
      navigateTo(targetPage, true);
    }
  };

  const handleThemeSwitch = (e: React.MouseEvent<HTMLButtonElement>) => {
    const doc = document as any;
    
    // Fallback if browser doesn't support View Transitions
    if (!doc.startViewTransition) {
      toggleTheme();
      return;
    }

    const x = e.clientX;
    const y = e.clientY;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = doc.startViewTransition(() => {
      flushSync(() => {
        toggleTheme();
      });
    });

    transition.ready.then(() => {
      // Apple Fluid Easing: cubic-bezier(0.16, 1, 0.3, 1)
      const appleFluidEasing = 'cubic-bezier(0.16, 1, 0.3, 1)';
      const duration = 750;

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: duration,
          easing: appleFluidEasing,
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  const ThemeToggle = () => (
    <button 
      onClick={handleThemeSwitch}
      className="relative w-14 h-7 rounded-full bg-gray-200/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 transition-all duration-500 hover:bg-gray-200 dark:hover:bg-white/10 focus:outline-none"
      aria-label="Switch Theme"
    >
      <div className="absolute inset-0 flex items-center justify-between px-1.5 opacity-40 pointer-events-none">
         <Sun size={10} className="text-amber-600 dark:text-amber-500" />
         <Moon size={10} className="text-indigo-600 dark:text-indigo-400" />
      </div>
      <div 
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center transform transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isDark ? 'translate-x-7' : 'translate-x-0'}`}
      >
         <div className="relative w-full h-full">
            <Sun 
              size={14} 
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} 
              fill="currentColor"
            />
            <Moon 
              size={14} 
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} 
              fill="currentColor"
            />
         </div>
      </div>
    </button>
  );

  // Custom Animated Hamburger Icon
  const HamburgerIcon = () => (
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="relative h-10 w-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors z-50 group focus:outline-none"
        aria-label="Toggle Menu"
      >
          <div className="relative w-6 h-5">
            <span className={`absolute left-0 h-0.5 bg-slate-900 dark:bg-white rounded-full transition-all duration-300 ease-in-out w-full origin-center ${
                isMenuOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0'
            }`} />
            <span className={`absolute top-1/2 -translate-y-1/2 left-0 h-0.5 bg-slate-900 dark:bg-white rounded-full transition-all duration-300 ease-in-out w-full ${
                isMenuOpen ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'
            }`} />
            <span className={`absolute left-0 h-0.5 bg-slate-900 dark:bg-white rounded-full transition-all duration-300 ease-in-out w-full origin-center ${
                isMenuOpen ? 'bottom-1/2 translate-y-1/2 -rotate-45' : 'bottom-0'
            }`} />
          </div>
      </button>
  );

  return (
    <nav ref={navRef} className="sticky top-0 z-50 w-full bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-300 dark:border-white/10 transition-colors duration-300">
      {/* Top glowing line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <a 
            href={user ? "/market" : "/"}
            className="flex-shrink-0 flex items-center cursor-pointer group z-50 no-underline" 
            onClick={handleLogoClick}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 mr-2 text-indigo-600 dark:text-cyan-400 transition-transform duration-500 group-hover:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 1L3 5l4 4" />
              <path d="M21 11V9a4 4 0 0 0-4-4H3" />
              <path d="M17 23l4-4-4-4" />
              <path d="M3 13v2a4 4 0 0 0 4 4h14" />
            </svg>
            <div className="flex items-baseline gap-0.5 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
              <span className="text-2xl font-bold leading-none">E</span>
              <span className="text-lg font-bold leading-none tracking-tight">NLIZZO</span>
            </div>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {!isLoading && user && (
              <>
                <a 
                  href="/market"
                  onClick={(e) => handleLinkClick(e, 'marketplace')}
                  className={`text-sm font-mono transition-colors hover:text-cyan-600 dark:hover:text-cyan-400 no-underline ${currentPage === 'marketplace' ? 'text-cyan-600 dark:text-cyan-400 border-b border-cyan-500/50' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  BUY
                </a>
                <a 
                  href="/sell"
                  onClick={(e) => handleLinkClick(e, 'listing')}
                  className={`text-sm font-mono transition-colors hover:text-cyan-600 dark:hover:text-cyan-400 no-underline ${currentPage === 'listing' ? 'text-cyan-600 dark:text-cyan-400 border-b border-cyan-500/50' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  SELL
                </a>
                {user.role === 'ADMIN' && (
                     <a 
                     href="/admin"
                     onClick={(e) => handleLinkClick(e, 'admin')}
                     className={`flex items-center gap-1 text-sm font-mono transition-colors hover:text-red-600 dark:hover:text-red-400 no-underline ${currentPage === 'admin' ? 'text-red-600 dark:text-red-400 border-b border-red-500/50' : 'text-gray-600 dark:text-gray-400'}`}
                   >
                     <ShieldCheck size={14} /> ADMIN
                   </a>
                )}
              </>
            )}

            {/* Theme Toggle (Desktop) */}
            <ThemeToggle />

            {isLoading ? (
              // SKELETON LOADING STATE FOR USER
              <div className="flex items-center space-x-4 pl-4 border-l border-gray-200 dark:border-white/10 animate-pulse">
                <div className="text-right hidden lg:block space-y-1.5">
                   <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded"></div>
                   <div className="h-2 w-16 bg-gray-200 dark:bg-white/10 rounded ml-auto"></div>
                </div>
                <div className="h-8 w-8 rounded bg-gray-200 dark:bg-white/10"></div>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-gray-200 dark:border-white/10">
                 {/* Profile Button - Enhanced Clickability */}
                 <a 
                  href="/profile"
                  onClick={(e) => handleLinkClick(e, 'profile')}
                  className="flex items-center space-x-3 group relative z-50 cursor-pointer focus:outline-none p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors no-underline"
                  aria-label="Go to Profile"
                >
                  <div className="text-right hidden lg:block">
                    <div className="text-xs text-slate-900 dark:text-white font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{user.hostel?.toUpperCase() || 'STUDENT'}</div>
                  </div>
                  <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-800 p-0.5 border border-gray-300 dark:border-gray-700">
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name} 
                      className="h-full w-full rounded object-cover grayscale group-hover:grayscale-0 transition-all"
                    />
                  </div>
                </a>
                <button 
                  onClick={onLogout}
                  className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="group relative px-6 py-2 rounded-full bg-white dark:bg-white text-slate-900 font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 dark:shadow-white/10 hover:shadow-xl hover:shadow-indigo-500/30 dark:hover:shadow-white/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 overflow-hidden ring-1 ring-gray-200 dark:ring-0"
              >
                <span className="relative z-10 flex items-center gap-2">
                  LOGIN
                  <span className="bg-indigo-50 dark:bg-slate-100 rounded-full p-0.5 text-indigo-600 transition-transform group-hover:translate-x-1">
                    <ArrowRight size={14} strokeWidth={3} />
                  </span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 via-white to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <HamburgerIcon />
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay - Modern Glass Design */}
      <div 
        className={`md:hidden fixed inset-0 top-[64px] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl transition-all duration-500 ease-in-out z-40 ${isMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
        style={{ height: 'calc(100vh - 64px)' }} 
      >
         <div className="flex flex-col h-full overflow-y-auto p-4">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-pulse">
                  <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-white/10"></div>
                  <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded"></div>
               </div>
            ) : user ? (
              <div className="space-y-4 animate-slide-up">
                {/* Redesigned User Profile Card - Horizontal Layout */}
                <a 
                  href="/profile"
                  className="relative block overflow-hidden rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 group cursor-pointer active:scale-[0.99] transition-all no-underline"
                  onClick={(e) => { handleLinkClick(e, 'profile'); setIsMenuOpen(false); }}
                >
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   
                   <div className="flex items-center gap-4 relative z-10">
                      {/* Avatar with ring */}
                      <div className="relative flex-shrink-0">
                          <div className="h-14 w-14 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 to-purple-500">
                              <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover border-2 border-white dark:border-gray-900" />
                          </div>
                           {/* Online/Status Indicator - Updated Green to Emerald */}
                          <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                      </div>

                      {/* Text Info - Left Aligned */}
                      <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{user.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1.5">{user.email}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                              {user.hostel}
                           </span>
                      </div>

                      {/* Settings Icon Button */}
                      <div className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-indigo-500 transition-colors">
                          <Settings size={20} />
                      </div>
                   </div>
                </a>

                {/* Main Navigation Links */}
                <div className="grid gap-3">
                   <a 
                     href="/market"
                     onClick={(e) => { handleLinkClick(e, 'marketplace'); setIsMenuOpen(false); }}
                     className="w-full p-3 flex items-center gap-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 shadow-sm hover:border-indigo-500/50 dark:hover:border-cyan-500/50 transition-all group active:scale-[0.99] no-underline"
                   >
                      <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 flex-shrink-0">
                         <ShoppingBag size={22} />
                      </div>
                      <div className="text-left flex-1">
                         <div className="font-bold text-slate-900 dark:text-white text-base">Buy Items</div>
                         <div className="text-[11px] text-gray-500 dark:text-gray-400">Browse marketplace</div>
                      </div>
                      <ArrowRight size={18} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                   </a>

                   <a 
                     href="/sell"
                     onClick={(e) => { handleLinkClick(e, 'listing'); setIsMenuOpen(false); }}
                     className="w-full p-3 flex items-center gap-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 shadow-sm hover:border-indigo-500/50 dark:hover:border-cyan-500/50 transition-all group active:scale-[0.99] no-underline"
                   >
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 flex-shrink-0">
                         <PlusCircle size={22} />
                      </div>
                      <div className="text-left flex-1">
                         <div className="font-bold text-slate-900 dark:text-white text-base">Sell Item</div>
                         <div className="text-[11px] text-gray-500 dark:text-gray-400">List something new</div>
                      </div>
                      <ArrowRight size={18} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                   </a>
                </div>

                {/* Secondary Links */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-1">
                   <a 
                     href="/market"
                     onClick={(e) => { handleLinkClick(e, 'marketplace'); setIsMenuOpen(false); }} 
                     className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors no-underline"
                   >
                      <Home size={18} /> <span>Home Feed</span>
                   </a>
                   <a 
                     href="/profile"
                     onClick={(e) => { handleLinkClick(e, 'profile'); setIsMenuOpen(false); }} 
                     className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors no-underline"
                   >
                      <User size={18} /> <span>My Profile</span>
                   </a>
                   {user.role === 'ADMIN' && (
                      <a 
                        href="/admin"
                        onClick={(e) => { handleLinkClick(e, 'admin'); setIsMenuOpen(false); }} 
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 no-underline"
                      >
                         <ShieldCheck size={18} /> <span>Admin Panel</span>
                      </a>
                   )}
                </div>

                {/* Logout */}
                <div className="mt-auto pt-4">
                   <Button 
                      variant="outline" 
                      fullWidth 
                      onClick={() => { onLogout(); setIsMenuOpen(false); }} 
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 justify-center h-11"
                   >
                      <LogOut size={18} className="mr-2" /> Log Out
                   </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center space-y-8 animate-slide-up">
                  <div className="text-center">
                     <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome to Enlizzo</h2>
                     <p className="text-gray-500 dark:text-gray-400">The exclusive marketplace for IIT Delhi.</p>
                  </div>
                  <Button size="lg" onClick={() => { onLogin(); setIsMenuOpen(false); }} className="w-full max-w-xs shadow-xl shadow-indigo-500/20">
                     Login with IITD Email
                  </Button>
              </div>
            )}
         </div>
      </div>
    </nav>
  );
};
