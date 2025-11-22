
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronDown, Filter, X, Check, History, ChevronUp, Plus, MapPin } from 'lucide-react';
import { Product, Category, FilterState } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { SEARCH_SUFFIXES } from '../constants';
import { PullToRefresh } from '../components/PullToRefresh';
import { fetchRecentlyViewedIds } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

interface MarketplaceProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  isLoading: boolean;
  userId?: string;
  isDemo: boolean;
  onSellClick: () => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ 
  products, 
  onProductClick, 
  savedIds, 
  onToggleSave, 
  onRefresh, 
  isRefreshing, 
  isLoading, 
  userId, 
  isDemo,
  onSellClick
}) => {
  const { currentCampus } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState<'category' | 'hostel' | 'price' | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  
  // Recently Viewed Expansion Logic
  const [isRVExpanded, setIsRVExpanded] = useState(false);
  const rvCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Dropdown Hover Logic
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Price Slider Hover Logic
  const [hoverPrice, setHoverPrice] = useState<number | null>(null);
  const [hoverLeft, setHoverLeft] = useState<number>(0);
  const sliderRef = useRef<HTMLInputElement>(null);
  
  // Rolling Search State
  const [suffixIndex, setSuffixIndex] = useState(0);
  
  const filterRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'All',
    minPrice: 0,
    maxPrice: 100000,
    hostel: 'All',
    donationOnly: false,
  });

  const HOSTEL_LIST = currentCampus?.hostels || [];

  // Rolling Suffix Logic - Ultra Slow & Smooth
  useEffect(() => {
    const interval = setInterval(() => {
      setSuffixIndex((prev) => (prev + 1) % SEARCH_SUFFIXES.length);
    }, 6000); 
    return () => clearInterval(interval);
  }, []);

  // Load Recently Viewed
  useEffect(() => {
    if (userId) {
        fetchRecentlyViewedIds(userId, isDemo).then(setRecentlyViewedIds);
    }
  }, [userId, isDemo]);

  // Auto-Collapse Logic for Recently Viewed
  useEffect(() => {
    if (isRVExpanded) {
        if (rvCollapseTimerRef.current) clearTimeout(rvCollapseTimerRef.current);
        rvCollapseTimerRef.current = setTimeout(() => {
            setIsRVExpanded(false);
        }, 120000);
    }
    return () => {
        if (rvCollapseTimerRef.current) clearTimeout(rvCollapseTimerRef.current);
    };
  }, [isRVExpanded]);

  // Close dropdowns on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (activeDropdown) setActiveDropdown(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeDropdown]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 0. Campus Isolation Filter (Client-side redundancy)
      if (currentCampus && p.campusId && p.campusId !== currentCampus.id) {
         return false; 
      }

      // 1. Status Filter
      const status = p.status?.toUpperCase();
      if (p.isSold || status === 'SOLD' || status === 'ARCHIVED' || status === 'FLAGGED') {
        return false;
      }
      
      // 2. Search Filter
      if (filters.search && !p.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      
      // 3. Dropdown Filters
      if (filters.category !== 'All' && p.category !== filters.category) return false;
      if (filters.hostel !== 'All' && p.sellerHostel !== filters.hostel) return false;
      
      // 4. Donation vs Sale Filter
      const price = typeof p.price === 'number' ? p.price : 0;

      if (filters.donationOnly) {
         if (price > 0) return false;
      } else {
         if (price === 0) return false;
         if (price < filters.minPrice || price > filters.maxPrice) return false;
      }

      return true;
    });
  }, [filters, products, currentCampus]);

  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewedIds
        .map(id => products.find(p => p.id === id))
        .filter(Boolean) as Product[];
  }, [recentlyViewedIds, products]);

  const isFilterActive = useMemo(() => {
      return filters.category !== 'All' || filters.hostel !== 'All' || filters.maxPrice < 100000 || filters.donationOnly;
  }, [filters]);

  // --- Dropdown Hover Handlers ---

  const handleMouseEnterDropdown = (name: 'category' | 'hostel' | 'price', event: React.MouseEvent<HTMLElement>) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    let left = rect.left;
    const width = name === 'price' ? 288 : 200; 
    
    // Prevent overflow right
    if (left + width > window.innerWidth) {
      left = window.innerWidth - width - 16;
    }
    
    setDropdownPos({ top: rect.bottom + 8, left: Math.max(16, left) });
    setActiveDropdown(name);
  };

  const handleMouseLeaveDropdown = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150); 
  };

  const handleMouseEnterContent = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  // --- Price Slider Hover Handlers ---

  const handleSliderMove = (e: React.MouseEvent<HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, x / width));
    
    const min = 0;
    const max = 100000;
    const step = 500;
    
    const rawValue = min + percentage * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    
    setHoverPrice(steppedValue);
    setHoverLeft(x);
  };

  const handleSliderLeave = () => {
    setHoverPrice(null);
  };

  const handleSliderClick = () => {
    if (hoverPrice !== null) {
      setFilters({...filters, maxPrice: hoverPrice});
    }
  };

  const resetRVTimer = () => {
    if (isRVExpanded && rvCollapseTimerRef.current) {
        clearTimeout(rvCollapseTimerRef.current);
        rvCollapseTimerRef.current = setTimeout(() => {
            setIsRVExpanded(false);
        }, 120000);
    }
  };

  const feedAnimationKey = `${filters.donationOnly}-${filters.category}-${filters.hostel}`;

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Campus Header */}
      {currentCampus && (
        <div className="bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border-b border-gray-100 dark:border-white/5 py-1 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-[10px] font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">
                <MapPin size={10} />
                {currentCampus.name} Marketplace
            </div>
        </div>
      )}

      {/* Sticky Filter Bar */}
      <div 
        ref={filterRef}
        className="sticky top-[64px] z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-gray-200 dark:border-white/10 shadow-sm transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4 overflow-x-auto no-scrollbar">
          
          {/* Rolling Search Compact */}
          <div className="relative flex-shrink-0 w-48 md:w-64 h-9 bg-gray-100 dark:bg-white/10 rounded-full transition-all duration-300 focus-within:bg-white dark:focus-within:bg-black focus-within:ring-2 focus-within:ring-indigo-500/20 overflow-hidden group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 group-focus-within:text-indigo-500 transition-colors" />
            
            <input
              type="text"
              placeholder=""
              className="absolute inset-0 w-full h-full pl-9 pr-4 rounded-full bg-transparent outline-none text-sm text-gray-900 dark:text-white z-20 placeholder-transparent"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />

            {!filters.search && (
              <div className="absolute left-9 top-0 bottom-0 right-4 flex items-center overflow-hidden pointer-events-none z-0">
                 <span className="text-sm text-gray-500/40 mr-1 whitespace-nowrap font-medium">Search</span>
                 
                 <div className="relative h-full w-full overflow-hidden">
                    {SEARCH_SUFFIXES.map((text, i) => {
                      const isCurrent = i === suffixIndex;
                      const isPrev = i === (suffixIndex - 1 + SEARCH_SUFFIXES.length) % SEARCH_SUFFIXES.length;
                      
                      const transitionStyle = {
                        transitionProperty: 'all',
                        transitionDuration: '3000ms', 
                        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                      };

                      return (
                        <span
                          key={i}
                          style={transitionStyle}
                          className={`absolute left-0 top-1/2 -translate-y-1/2 text-sm font-medium whitespace-nowrap block ${
                             isCurrent ? 'translate-y-[-50%] opacity-40 blur-0' : 
                             isPrev ? 'translate-y-[-150%] opacity-0 blur-sm' : 
                             'translate-y-[50%] opacity-0 blur-sm'
                          } text-gray-500 dark:text-gray-400`}
                        >
                          {text}
                        </span>
                      );
                    })}
                 </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2 hidden sm:block"></div>

          {/* Category Dropdown Trigger */}
          <button 
            onMouseEnter={(e) => handleMouseEnterDropdown('category', e)}
            onMouseLeave={handleMouseLeaveDropdown}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filters.category !== 'All' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'}`}
          >
            <span>{filters.category === 'All' ? 'Category' : filters.category}</span>
            <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'category' ? 'rotate-180' : ''}`} />
          </button>
            
          {/* Hostel Dropdown Trigger */}
          <button 
            onMouseEnter={(e) => handleMouseEnterDropdown('hostel', e)}
            onMouseLeave={handleMouseLeaveDropdown}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filters.hostel !== 'All' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'}`}
          >
            <span>{filters.hostel === 'All' ? 'Hostel' : filters.hostel}</span>
            <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'hostel' ? 'rotate-180' : ''}`} />
          </button>

          {/* Price Dropdown Trigger */}
          <button 
            onMouseEnter={(e) => handleMouseEnterDropdown('price', e)}
            onMouseLeave={handleMouseLeaveDropdown}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filters.maxPrice < 100000 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'}`}
          >
            <span>Price</span>
            <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'price' ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex-1"></div>

          {/* Toggle & Reset Container */}
          <div className="flex items-center flex-shrink-0">
              {/* Premium Sliding Toggle */}
              <div 
                  onClick={() => setFilters({...filters, donationOnly: !filters.donationOnly})}
                  className="relative flex bg-gray-100 dark:bg-white/5 rounded-full p-1 h-10 w-52 flex-shrink-0 select-none shadow-inner cursor-pointer"
              >
                 <div 
                   className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full shadow-md transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] left-1 ${
                     filters.donationOnly 
                       ? 'translate-x-full bg-emerald-500' 
                       : 'translate-x-0 bg-indigo-600'
                   }`}
                 ></div>
                 
                 <div className="flex-1 relative z-10 flex items-center justify-center text-sm font-bold transition-colors duration-700 pointer-events-none">
                     <span className={!filters.donationOnly ? 'text-white' : 'text-gray-500 dark:text-gray-400'}>For Sale</span>
                 </div>
                 <div className="flex-1 relative z-10 flex items-center justify-center text-sm font-bold transition-colors duration-700 pointer-events-none">
                     <span className={filters.donationOnly ? 'text-white' : 'text-gray-500 dark:text-gray-400'}>Donation</span>
                 </div>
              </div>

              {/* Clear Filters */}
              <div 
                  className={`
                      flex items-center overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
                      ${isFilterActive ? 'max-w-[100px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'}
                  `}
              >
                 <button 
                   onClick={() => setFilters({
                     search: '',
                     category: 'All',
                     minPrice: 0,
                     maxPrice: 100000,
                     hostel: 'All',
                     donationOnly: false
                   })}
                   className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 transition-all shadow-sm whitespace-nowrap group"
                   title="Reset Filters"
                 >
                   <span>Reset</span>
                   <div className="bg-gray-200 dark:bg-white/20 rounded-full p-0.5 group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                     <X size={12} />
                   </div>
                 </button>
              </div>
          </div>
        </div>
      </div>

      <a
        href="/sell"
        onClick={(e) => {
           e.stopPropagation();
           if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
           e.preventDefault();
           onSellClick();
        }}
        className="md:hidden fixed bottom-6 right-6 h-10 w-10 bg-indigo-600/80 backdrop-blur-sm text-white rounded-full shadow-lg shadow-indigo-500/20 flex items-center justify-center z-[60] hover:scale-110 transition-all active:scale-95 no-underline border border-white/10"
        aria-label="Sell Item"
      >
        <Plus size={20} strokeWidth={2.5} />
      </a>

      <PullToRefresh onRefresh={onRefresh}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[80vh]">
          
          {/* Recently Viewed Section */}
          {recentlyViewedIds.length > 0 && !isLoading && (
            <div 
                className="mb-10 transition-all duration-500 ease-in-out"
                onTouchStart={resetRVTimer}
                onMouseMove={resetRVTimer}
            >
               <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Recently Viewed</h3>
                  </div>
                  <button 
                    onClick={() => setIsRVExpanded(!isRVExpanded)}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                  >
                    {isRVExpanded ? 'Show Less' : 'Show All'}
                    {isRVExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
               </div>

               {isRVExpanded ? (
                   <div className="animate-slide-up">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                        {recentlyViewedProducts.map(product => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                onPress={onProductClick}
                                isSaved={savedIds.has(product.id)}
                                onToggleSave={(e) => {
                                    e.stopPropagation();
                                    onToggleSave(product.id);
                                }}
                            />
                        ))}
                    </div>
                   </div>
               ) : (
                   <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar animate-fade-in">
                      {recentlyViewedProducts.map(product => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            onPress={onProductClick}
                            isSaved={savedIds.has(product.id)}
                            onToggleSave={(e) => {
                                e.stopPropagation();
                                onToggleSave(product.id);
                            }}
                            variant="compact"
                        />
                      ))}
                   </div>
               )}
            </div>
          )}

          {/* Main Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {Array.from({ length: 10 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div 
              key={feedAnimationKey}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 min-h-[300px] content-start"
            >
              {filteredProducts.map((product, index) => (
                <div 
                  key={product.id}
                  className="animate-slide-up"
                  style={{ 
                    animationDelay: `${index * 30}ms`
                  }}
                >
                  <ProductCard 
                    product={product} 
                    onPress={onProductClick}
                    isSaved={savedIds.has(product.id)}
                    onToggleSave={(e) => {
                      e.stopPropagation();
                      onToggleSave(product.id);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 animate-fade-in">
              <div className="inline-flex items-center justify-center p-6 bg-gray-100 dark:bg-white/5 rounded-full mb-4">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No items found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {filters.donationOnly ? "No donation items found in your campus." : "No items found in your campus."}
              </p>
              <button 
                 onClick={() => setFilters({
                   search: '',
                   category: 'All',
                   minPrice: 0,
                   maxPrice: 100000,
                   hostel: 'All',
                   donationOnly: filters.donationOnly
                 })}
                 className="text-indigo-500 hover:underline"
               >
                 Clear Filters
               </button>
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Fixed Position Dropdowns */}
      {activeDropdown && dropdownPos && (
        <div 
          onMouseEnter={handleMouseEnterContent}
          onMouseLeave={handleMouseLeaveDropdown}
          className="fixed z-50 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 p-1 animate-slide-up overflow-hidden"
          style={{ 
            top: dropdownPos.top, 
            left: dropdownPos.left,
            minWidth: activeDropdown === 'price' ? '18rem' : '12rem'
          }}
        >
          {activeDropdown === 'category' && (
            <div className="max-h-80 overflow-y-auto">
              <button onClick={() => { setFilters({...filters, category: 'All'}); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 flex justify-between items-center text-gray-700 dark:text-gray-200"><span>All Categories</span>{filters.category === 'All' && <Check size={14} className="text-indigo-600" />}</button>
              {Object.values(Category).map(c => (
                <button key={c} onClick={() => { setFilters({...filters, category: c}); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 flex justify-between items-center text-gray-700 dark:text-gray-200"><span>{c}</span>{filters.category === c && <Check size={14} className="text-indigo-600" />}</button>
              ))}
            </div>
          )}
          {activeDropdown === 'hostel' && (
            <div className="max-h-80 overflow-y-auto">
              <button onClick={() => { setFilters({...filters, hostel: 'All'}); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 flex justify-between items-center text-gray-700 dark:text-gray-200"><span>All Hostels</span>{filters.hostel === 'All' && <Check size={14} className="text-indigo-600" />}</button>
              {HOSTEL_LIST.map(h => (
                <button key={h} onClick={() => { setFilters({...filters, hostel: h}); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 flex justify-between items-center text-gray-700 dark:text-gray-200"><span>{h}</span>{filters.hostel === h && <Check size={14} className="text-indigo-600" />}</button>
              ))}
            </div>
          )}
          {activeDropdown === 'price' && (
            <div className="p-5 w-72 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="mb-6">
                <div className="flex justify-between items-end mb-4">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Max Price</span>
                    <span className="text-xl font-mono font-bold text-indigo-600 dark:text-indigo-400">₹{filters.maxPrice}</span>
                </div>
                
                <div className="relative h-8 flex items-center justify-center group select-none">
                    <div className="absolute left-0 right-0 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"></div>
                    <div 
                        className="absolute left-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-75 ease-out pointer-events-none"
                        style={{ width: `${(filters.maxPrice / 100000) * 100}%` }}
                    />
                    <div 
                        className="absolute h-5 w-5 bg-white dark:bg-slate-900 border-[3px] border-indigo-500 rounded-full shadow-lg shadow-indigo-500/30 z-10 pointer-events-none transition-transform duration-75 ease-out transform -translate-x-1/2 group-hover:scale-110"
                        style={{ left: `${(filters.maxPrice / 100000) * 100}%` }}
                    />
                    <input 
                        ref={sliderRef}
                        type="range" 
                        min="0" 
                        max="100000" 
                        step="500" 
                        value={filters.maxPrice} 
                        onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})} 
                        onMouseMove={handleSliderMove}
                        onMouseLeave={handleSliderLeave}
                        onClick={handleSliderClick}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                    />
                </div>
                
                <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-2 px-1">
                    <span>₹0</span>
                    <span>₹50k</span>
                    <span>₹1L</span>
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-white/5">
                  <button onClick={() => setActiveDropdown(null)} className="text-xs font-bold text-indigo-600 uppercase tracking-wide hover:text-indigo-800 dark:hover:text-indigo-400 px-4 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">Done</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
