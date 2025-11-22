
import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-900/40 rounded-xl overflow-hidden border border-gray-200 dark:border-white/5 relative animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200 dark:bg-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title Line */}
        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4 relative overflow-hidden">
           <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
        </div>
        
        {/* Price Line */}
        <div className="flex items-end gap-2 pt-1">
           <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-1/3 relative overflow-hidden">
               <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
           </div>
        </div>

        {/* Footer Line */}
        <div className="flex justify-between pt-3 border-t border-gray-100 dark:border-white/5 mt-1">
          <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-1/4 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-1/5 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
