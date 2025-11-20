
import React from 'react';
import { Heart, MapPin } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  isSaved?: boolean;
  onToggleSave?: (e: React.MouseEvent) => void;
  variant?: 'default' | 'compact';
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onPress, 
  isSaved = false, 
  onToggleSave,
  variant = 'default'
}) => {
  const imageUrl = (product.images && product.images.length > 0) 
    ? product.images[0] 
    : 'https://via.placeholder.com/400?text=No+Image';

  const isCompact = variant === 'compact';

  if (isCompact) {
    return (
      <div 
        className="group relative bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-white/5 rounded-lg overflow-hidden transition-all duration-300 hover:border-indigo-500/50 cursor-pointer hover:-translate-y-0.5 shadow-sm w-32 flex-shrink-0"
        onClick={() => onPress(product)}
      >
        <div className="aspect-square overflow-hidden relative bg-gray-100 dark:bg-gray-800">
          <img 
            src={imageUrl} 
            alt={product.title} 
            loading="lazy"
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
          {onToggleSave && (
            <button 
              onClick={onToggleSave}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors"
            >
               <Heart 
                size={12} 
                className={`transition-colors ${isSaved ? 'fill-pink-500 text-pink-500' : 'text-white'}`} 
              />
            </button>
          )}
        </div>
        <div className="p-2">
           <h3 className="text-[10px] leading-tight font-medium text-gray-700 dark:text-gray-300 line-clamp-2 mb-1 group-hover:text-indigo-500 transition-colors">
             {product.title}
           </h3>
           <div className="flex items-baseline gap-1">
             <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
               {product.price === 0 ? 'FREE' : `₹${product.price}`}
             </span>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group relative bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:border-indigo-500/50 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_0_15px_rgba(79,70,229,0.15)] cursor-pointer hover:-translate-y-1 content-visibility-auto contain-paint"
      onClick={() => onPress(product)}
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden relative bg-gray-100 dark:bg-gray-800">
        <img 
          src={imageUrl} 
          alt={product.title} 
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
          {product.price === 0 ? (
            <span className="px-2 py-0.5 bg-green-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wide rounded-sm shadow-sm">
              DONATION
            </span>
          ) : product.originalPrice && (
            <span className="px-2 py-0.5 bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wide rounded-sm shadow-sm">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Save Button */}
        <button 
          onClick={onToggleSave}
          className="absolute top-2 right-2 p-1.5 rounded bg-white/90 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 text-gray-600 dark:text-white/70 transition-colors backdrop-blur-sm border border-gray-200 dark:border-white/10 shadow-sm"
        >
          <Heart 
            size={16} 
            className={`transition-colors ${isSaved ? 'fill-pink-500 text-pink-500' : 'text-current'}`} 
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2 h-10">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
            {product.title}
          </h3>
        </div>
        
        <div className="flex items-end justify-between mb-3 border-b border-gray-100 dark:border-white/5 pb-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-mono">Price</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                {product.price === 0 ? 'FREE' : `₹${product.price}`}
              </span>
              {product.originalPrice && product.price > 0 && (
                <span className="text-xs text-gray-400 line-through font-mono">₹{product.originalPrice}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono uppercase tracking-tight">
           <div className="flex items-center gap-1">
             <MapPin size={10} />
             <span className="truncate max-w-[80px]">{product.sellerHostel}</span>
           </div>
           <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400">
             {product.condition}
           </span>
        </div>
      </div>
    </div>
  );
};
