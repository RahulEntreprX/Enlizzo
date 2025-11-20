
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronDown, Filter, X, Check, History, ChevronUp } from 'lucide-react';
import { Product, Category, FilterState } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { HOSTELS, SEARCH_SUFFIXES } from '../constants';
import { PullToRefresh } from '../components/PullToRefresh';
import { fetchRecentlyViewedIds } from '../services/db';

interface MarketplaceProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  isLoading: boolean;
  userId?: string;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ products, onProductClick, savedIds, onToggleSave, onRefresh, isRefreshing, isLoading, userId }) => {
  const [activeDropdown, setActiveDropdown] = useState<'category' | 'hostel' | 'price' | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  
  // Recently Viewed Expansion Logic
  const [isRVExpanded, setIsRVExpanded] = useState(false);
  const rvCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Rolling Search State
  const [suffixIndex, setSuffixIndex] = useState(0);
  
  const filterRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'All',
    minPrice: 0,
    maxPrice: 10000,
    hostel: 'All',
    donationOnly: false,
  });

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
        fetchRecentlyViewedIds(userId).then(setRecentlyViewedIds);
    }
  }, [userId]);

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

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      const isTrigger = target.closest('[data-dropdown-trigger]');
      const isContent = target.closest('[data-dropdown-content]');
      if (!isTrigger && !isContent) {
        setActiveDropdown(null);
      }
    };
    
    const handleScroll = () => {
      if (activeDropdown) setActiveDropdown(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeDropdown]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (filters.search && !p.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.category !== 'All' && p.category !== filters.category) return false;
      if (filters.hostel !== 'All' && p.sellerHostel !== filters.hostel) return false;
      if (filters.donationOnly && p.price > 0) return false;
      if (!filters.donationOnly && (p.price < filters.minPrice || p.price > filters.maxPrice)) return false;
      return true;
    });
  }, [filters, products]);

  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewedIds
        .map(id => products.find(p => p.id === id))
        .filter(Boolean) as Product[];
  }, [recentlyViewedIds, products]);

  const toggleDropdown = (name: 'category' | 'hostel' | 'price', event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      let left = rect.left;
      const width = name === 'price' ? 256 : 192;
      if (left + width > window.innerWidth) {
        left = window.innerWidth - width - 16;
      }
      setDropdownPos({ top: rect.bottom + 8, left: Math.max(16, left) });
      setActiveDropdown(name);
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

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Sticky Filter Bar */}
      <div 
        ref={filterRef}
        className="sticky top-16 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-gray-200 dark:border-white/10 shadow-sm transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4 overflow-x-auto no-scrollbar">
          
          {/* Rolling Search Compact */}
          <div className="relative flex-shrink-0 w-48 md:w-64 h-9 bg-gray-100 dark:bg-white/10 rounded-full transition-all duration-300 focus-within:bg-white dark:focus-within:bg-black focus-within:ring-2 focus-within:ring-indigo-500/20 overflow-hidden group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 group-focus-within:text-indigo-500 transition-colors" />
            
            {/* The Actual Input */}
            <input
              type="text"
              placeholder=""
              className="absolute inset-0 w-full h-full pl-9 pr-4 rounded-full bg-transparent outline-none text-sm text-gray-900 dark:text-white z-20 placeholder-transparent"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />

            {/* The Animated Placeholder Overlay */}
            {!filters.search && (
              <div className="absolute left-9 top-0 bottom-0 right-4 flex items-center overflow-hidden pointer-events-none z-0">
                 <span className="text-sm text-gray-500/40 mr-1 whitespace-nowrap font-medium">Search</span>
                 
                 <div className="relative h-full w-full overflow-hidden">
                    {SEARCH_SUFFIXES.map((text, i) => {
                      const isCurrent = i === suffixIndex;
                      // Identify the "previous" one to slide it up
                      const isPrev = i === (suffixIndex - 1 + SEARCH_SUFFIXES.length) % SEARCH_SUFFIXES.length;
                      
                      const transitionStyle = {
                        transitionProperty: 'all',
                        transitionDuration: '4000ms', 
                        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                      };

                      return (
                        <span
                          key={i}
                          style={transitionStyle}
                          className={`absolute left-0 top-1/2 -translate-y-1/2 text-sm font-medium whitespace-nowrap block ${
                             isCurrent ? 'translate-y-[-50%] opacity-40 blur-0' : // Subtly visible
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

          {/* Category Dropdown */}
          <button 
            data-dropdown-trigger
            onClick={(e) => toggleDropdown('category', e)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filters.category !== 'All' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'}`}
          >
            <span>{filters.category === 'All' ? 'Category' : filters.category}</span>
            <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'category' ? 'rotate-180' : ''}`} />
          </button>
            
          {/* Hostel Dropdown */}
          <button 
            data-dropdown-trigger
            onClick={(e) => toggleDropdown('hostel', e)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filters.hostel !== 'All' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'}`}
          >
            <span>{filters.hostel === 'All' ? 'Hostel' : filters.hostel}</span>
            <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'hostel' ? 'rotate-180' : ''}`} />
          </button>

          {/* Price Dropdown */}
          <button 
            data-dropdown-trigger
            onClick={(e) => toggleDropdown('price', e)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filters.maxPrice < 10000 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'}`}
          >
            <span>Price</span>
            <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'price' ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex-1"></div>

          {/* Donation Toggle */}
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer select-none bg-gray-200 dark:bg-gray-800 rounded-full p-1 relative h-8 w-36 transition-colors"
            onClick={() => setFilters({...filters, donationOnly: !filters.donationOnly})}
          >
            <div 
              className={`absolute top-1 bottom-1 w-[50%] rounded-full shadow-sm transition-all duration-300 ease-out flex items-center justify-center text-xs font-bold ${
                filters.donationOnly 
                  ? 'left-[48%] bg-green-500 text-white' 
                  : 'left-1 bg-blue-500 text-white'
              }`}
            >
              {filters.donationOnly ? 'Donated' : 'Buy'}
            </div>
            <div className="w-1/2 text-center text-xs font-medium text-gray-500 z-0">Buy</div>
            <div className="w-1/2 text-center text-xs font-medium text-gray-500 z-0">Donated</div>
          </div>

          {/* Clear Filters */}
          {(filters.category !== 'All' || filters.hostel !== 'All' || filters.maxPrice < 10000 || filters.donationOnly) && (
             <button 
               onClick={() => setFilters({
                 search: '',
                 category: 'All',
                 minPrice: 0,
                 maxPrice: 10000,
                 hostel: 'All',
                 donationOnly: false
               })}
               className="ml-2 flex-shrink-0 p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
               title="Clear Filters"
             >
               <X size={16} />
             </button>
          )}
        </div>
      </div>

      <PullToRefresh onRefresh={onRefresh}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[80vh]">
          
          {/* Recently Viewed Section */}
          {recentlyViewedProducts.length > 0 && !isLoading && (
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
                   // Expanded View (Grid)
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
                    <div className="my-8 border-b border-gray-200 dark:border-white/10 relative">
                         <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F0F4F8] dark:bg-[#030712] px-4 text-gray-400 text-xs uppercase tracking-widest">All Items</span>
                    </div>
                   </div>
               ) : (
                   // Collapsed View (Compact Row)
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 animate-fade-in">
              {filteredProducts.map(product => (
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
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center p-6 bg-gray-100 dark:bg-white/5 rounded-full mb-4">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No items found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Fixed Position Dropdowns */}
      {activeDropdown && dropdownPos && (
        <div 
          data-dropdown-content
          className="fixed z-50 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 p-1 animate-slide-up overflow-hidden"
          style={{ 
            top: dropdownPos.top, 
            left: dropdownPos.left,
            minWidth: activeDropdown === 'price' ? '16rem' : '12rem'
          }}
        >
          {activeDropdown === 'category' && (
            <div className="max-h-80 overflow-y-auto no-scrollbar">
              <button onClick={() => { setFilters({...filters, category: 'All'}); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 flex justify-between items-center text-gray-700 dark:text-gray-200"><span>All Categories</span>{filters.category === 'All' && <Check size={14} className="text-indigo-600" />}</button>
              {Object.values(Category).map(c => (
                <button key={c} onClick={() => { setFilters({...filters, category: c}); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 flex justify-between items-center text-gray-700 dark:text-gray-200"><span>{c}</span>{filters.category === c && <Check size={14} className="text-indigo-600" />}</button>
              ))}
            </div>
          )}
          {activeDropdown === 'hostel' && (
            <div className="max-h-80 overflow-y-auto no-scrollbar">
              <button onClick={() => { setFilters({...filters, hostel: 'All'}); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 flex justify-between items-center text-gray-700 dark:text-gray-200"><span>All Hostels</span>{filters.hostel === 'All' && <Check size={14} className="text-indigo-600" />}</button>
              {HOSTELS.map(h => (
                <button key={h} onClick={() => { setFilters({...filters, hostel: h}); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 flex justify-between items-center text-gray-700 dark:text-gray-200"><span>{h}</span>{filters.hostel === h && <Check size={14} className="text-indigo-600" />}</button>
              ))}
            </div>
          )}
          {activeDropdown === 'price' && (
            <div className="p-4 w-64">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2"><span>Range</span><span className="font-semibold text-indigo-600 dark:text-indigo-400">₹0 - ₹{filters.maxPrice}</span></div>
                <input type="range" min="0" max="10000" step="500" value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600" />
              </div>
              <div className="flex justify-end"><button onClick={() => setActiveDropdown(null)} className="text-xs font-bold text-indigo-600 uppercase tracking-wide hover:text-indigo-800 dark:hover:text-indigo-400">Apply</button></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
