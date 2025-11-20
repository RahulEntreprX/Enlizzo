
import React from 'react';
import { Moon, Sun, ShoppingBag, User as UserIcon, LogOut, Menu, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { Button } from './Button';

interface NavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  navigateTo: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  isDark, 
  toggleTheme, 
  user, 
  onLogin, 
  onLogout,
  navigateTo,
  currentPage
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

  return (
    <nav ref={navRef} className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-300 dark:border-white/10 transition-colors duration-300">
      {/* Top glowing line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer group" 
            onClick={() => navigateTo(user ? 'marketplace' : 'landing')}
          >
            {/* NEW LOGO: The Box Cycle (Minimalist) */}
            <div className="mr-2 relative h-10 w-10 flex items-center justify-center bg-transparent rounded-lg transition-colors">
               <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-indigo-600 dark:text-cyan-400 transition-transform duration-500 group-hover:rotate-90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {/* Top Half: Right to Left */}
                  <path d="M20 11V7a2 2 0 0 0-2-2H6" />
                  <path d="M9 2L6 5l3 3" />
                  {/* Bottom Half: Left to Right */}
                  <path d="M4 13v4a2 2 0 0 0 2 2h12" />
                  <path d="M15 22l3-3-3-3" />
               </svg>
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-bold text-xl leading-none tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                ENLIZZO
              </span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {user && (
              <>
                <button 
                  onClick={() => navigateTo('marketplace')}
                  className={`text-sm font-mono transition-colors hover:text-cyan-600 dark:hover:text-cyan-400 ${currentPage === 'marketplace' ? 'text-cyan-600 dark:text-cyan-400 border-b border-cyan-500/50' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  BUY
                </button>
                <button 
                  onClick={() => navigateTo('listing')}
                  className={`text-sm font-mono transition-colors hover:text-cyan-600 dark:hover:text-cyan-400 ${currentPage === 'listing' ? 'text-cyan-600 dark:text-cyan-400 border-b border-cyan-500/50' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  SELL
                </button>
                {user.role === 'ADMIN' && (
                     <button 
                     onClick={() => navigateTo('admin')}
                     className={`flex items-center gap-1 text-sm font-mono transition-colors hover:text-red-600 dark:hover:text-red-400 ${currentPage === 'admin' ? 'text-red-600 dark:text-red-400 border-b border-red-500/50' : 'text-gray-600 dark:text-gray-400'}`}
                   >
                     <ShieldCheck size={14} /> ADMIN
                   </button>
                )}
              </>
            )}

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-gray-200 dark:border-white/10">
                 <button 
                  onClick={() => navigateTo('profile')}
                  className="flex items-center space-x-3 group"
                >
                  <div className="text-right hidden lg:block">
                    <div className="text-xs text-slate-900 dark:text-white font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{user.hostel.toUpperCase()}</div>
                  </div>
                  <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-800 p-0.5 border border-gray-300 dark:border-gray-700">
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name} 
                      className="h-full w-full rounded object-cover grayscale group-hover:grayscale-0 transition-all"
                    />
                  </div>
                </button>
                <button 
                  onClick={onLogout}
                  className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Button onClick={onLogin} size="sm" className="bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-gray-200 border-0">
                LOGIN
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/10 animate-slide-up">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {user ? (
              <>
                <div className="flex items-center space-x-3 px-2 py-3 border-b border-gray-200 dark:border-gray-800 mb-2">
                   <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-800" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.hostel}</p>
                    </div>
                </div>
                <button onClick={() => { navigateTo('marketplace'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5">BUY ITEMS</button>
                <button onClick={() => { navigateTo('listing'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5">SELL ITEM</button>
                <button onClick={() => { navigateTo('profile'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5">PROFILE</button>
                {user.role === 'ADMIN' && (
                   <button onClick={() => { navigateTo('admin'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-white/5 font-bold">ADMIN DASHBOARD</button>
                )}
                <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">LOGOUT</button>
              </>
            ) : (
              <div className="p-2">
                <Button fullWidth onClick={() => { onLogin(); setIsMenuOpen(false); }}>Login with IITD</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
