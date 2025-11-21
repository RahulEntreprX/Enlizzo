
import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, disabled = false }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use Refs for values that change frequently to avoid re-renders during drag
  const contentRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const threshold = 120; // px to pull down to trigger refresh
  const maxPull = 200; // Maximum visual pull distance

  // Helper to update DOM directly without React reconciliation
  const updateDom = (y: number, refreshState: boolean) => {
    if (contentRef.current) {
      contentRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
    }
    if (loaderRef.current) {
      // Parallax effect for loader
      const loaderY = refreshState ? 20 : Math.max(-40, (y / 2) - 40);
      const rotation = y * 2;
      const opacity = refreshState || y > 0 ? 1 : 0;
      
      loaderRef.current.style.transform = `translate3d(0, ${loaderY}px, 0) rotate(${rotation}deg)`;
      loaderRef.current.style.opacity = String(opacity);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || window.scrollY > 5 || isRefreshing) return;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    
    // Remove transition during drag for instant response
    if (contentRef.current) contentRef.current.style.transition = 'none';
    if (loaderRef.current) loaderRef.current.style.transition = 'none';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || disabled) return;
    
    const y = e.touches[0].clientY;
    const delta = y - startY.current;

    // Only allow pulling down if we started at the top
    if (delta > 0) {
      // prevent default pull-to-refresh behavior of browser if needed
      // e.preventDefault(); 

      // Add logarithmic resistance
      // y = x / (1 + x/k) where k is scaling factor
      const resistance = delta * 0.5; 
      const damped = Math.min(resistance, maxPull);
      
      currentY.current = damped;
      
      // Direct DOM update
      requestAnimationFrame(() => {
        updateDom(damped, false);
      });
    }
  };

  const handleTouchEnd = async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    // Restore transitions
    if (contentRef.current) contentRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
    if (loaderRef.current) loaderRef.current.style.transition = 'all 0.3s ease';

    if (currentY.current > threshold / 2) {
      // Trigger Refresh
      setIsRefreshing(true);
      // Snap to loading position
      updateDom(60, true);
      
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          updateDom(0, false);
          currentY.current = 0;
        }, 500);
      }
    } else {
      // Snap back to top
      updateDom(0, false);
      currentY.current = 0;
    }
    startY.current = 0;
  };

  return (
    <div 
      className="min-h-screen relative touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Loading Indicator */}
      <div 
        ref={loaderRef}
        className="absolute left-0 right-0 flex justify-center items-center pointer-events-none z-0"
        style={{ 
          top: 0,
          opacity: 0,
          transform: 'translate3d(0, -40px, 0)'
        }}
      >
        <div className={`p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-white/10 ${isRefreshing ? 'animate-spin' : ''}`}>
          <RefreshCw size={20} className="text-indigo-600 dark:text-cyan-400" />
        </div>
      </div>

      {/* Content Container */}
      <div 
        ref={contentRef}
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  );
};
