
import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Share2, Heart, Phone, Flag, ShieldCheck, ChevronLeft, ChevronRight, Pencil, CheckCircle, Mail, X, RotateCcw } from 'lucide-react';
import { Product, User } from '../types';
import { Button } from '../components/Button';
import { updateListingStatus, reportListing, addToRecentlyViewed } from '../services/db';

interface ProductDetailsProps {
  product: Product;
  currentUser: User | null;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  onMarkAsSold: (newStatus: 'SOLD' | 'ACTIVE') => void;
  isDemo: boolean;
  onEdit: (product: Product) => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ 
  product, 
  currentUser, 
  onBack, 
  isSaved, 
  onToggleSave,
  onMarkAsSold,
  isDemo,
  onEdit
}) => {
  const [showContact, setShowContact] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  
  // Check if current user is the owner or ADMIN
  const isOwner = currentUser?.id === product.sellerId;
  const isAdmin = currentUser?.role === 'ADMIN';

  // Add to recently viewed ONLY if user stays for 3 seconds
  useEffect(() => {
    if (currentUser && product) {
        const timer = setTimeout(() => {
             addToRecentlyViewed(currentUser.id, product.id, isDemo);
        }, 3000); // 3 seconds "Intent to View" threshold
        
        return () => clearTimeout(timer);
    }
  }, [currentUser, product.id, isDemo]);

  const allImages = useMemo(() => {
    if (!product.images || product.images.length === 0) return ['https://via.placeholder.com/800?text=No+Image'];
    return product.images;
  }, [product]);

  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleReport = async () => {
    if (!currentUser) return alert("Please login first");
    const reason = prompt("Reason for reporting?");
    if (reason) {
      try {
        await reportListing(product.id, currentUser.id, reason, isDemo);
        alert("Report submitted for review.");
      } catch (e) {
        alert("Error submitting report.");
      }
    }
  };

  const handleShare = () => {
    // Clean URL sharing
    const url = `${window.location.origin}/product/${product.slug || product.id}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const handleAdminFlag = async () => {
    if (confirm("Are you sure you want to flag this listing? It will be hidden from public view.")) {
      await updateListingStatus(product.id, 'FLAGGED', isDemo);
      onBack(); 
    }
  };

  const handleToggleStatus = () => {
     const newStatus = product.isSold ? 'ACTIVE' : 'SOLD';
     const action = product.isSold ? 'mark this item as AVAILABLE' : 'mark this item as SOLD';
     
     if (window.confirm(`Are you sure you want to ${action}?`)) {
         onMarkAsSold(newStatus);
     }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative animate-fade-in">
      
      {/* Full Screen Image Modal */}
      {showFullImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in cursor-pointer"
          onClick={() => setShowFullImage(false)}
        >
          <button 
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
            onClick={() => setShowFullImage(false)}
          >
            <X size={24} />
          </button>
          <img 
            src={allImages[activeIndex]} 
            alt={product.title} 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()} 
          />
          {/* Navigation in Full View */}
          {allImages.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrev(e); }} 
                className="absolute left-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft size={32} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext(e); }} 
                className="absolute right-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Inline Back Button - Converted to Anchor */}
        <div className="mb-6">
            <a 
              href="/market"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
                e.preventDefault();
                onBack(); 
              }}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm hover:pl-3 no-underline cursor-pointer"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              <span>Back</span>
            </a>
        </div>

        {isAdmin && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl flex justify-between items-center">
            <div className="flex items-center text-red-400 gap-2"><ShieldCheck size={20} /><span className="font-bold">Admin Mode</span></div>
            <div className="flex gap-2"><Button size="sm" variant="danger" onClick={handleAdminFlag}>Flag as Inappropriate</Button></div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div 
              className="aspect-square rounded-2xl overflow-hidden glass-panel p-1 relative group cursor-zoom-in"
              onClick={() => setShowFullImage(true)}
            >
              <img src={allImages[activeIndex]} alt={product.title} className={`w-full h-full object-cover rounded-xl transition-all duration-500 ${product.isSold ? 'grayscale' : ''}`} />
              
              {product.isSold && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none">
                  <span className="px-6 py-2 bg-red-600 text-white text-3xl font-bold rounded-lg transform -rotate-12 border-4 border-white/50 shadow-2xl">SOLD</span>
                </div>
              )}

              {allImages.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                   <button onClick={handlePrev} className="pointer-events-auto p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"><ChevronLeft /></button>
                   <button onClick={handleNext} className="pointer-events-auto p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"><ChevronRight /></button>
                </div>
              )}

              {allImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none z-20">
                  {allImages.map((_, idx) => (
                    <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === activeIndex ? 'bg-white w-4' : 'bg-white/50'}`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 md:p-8 h-fit">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 mb-3">{product.category}</span>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{product.title}</h1>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-4">
                   <span>{product.createdAt}</span><span>•</span><span>{product.sellerHostel}</span>
                   {product.type === 'FOREVER' && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded border border-amber-200">PREMIUM</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500"><Share2 size={20} /></button>
                <button onClick={onToggleSave} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
                  <Heart size={20} className={isSaved ? 'fill-pink-500 text-pink-500' : 'text-gray-500'} />
                </button>
              </div>
            </div>

            <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 flex items-baseline gap-2">
              {product.price === 0 ? 'Free' : `₹${product.price}`}
              {product.originalPrice && product.price > 0 && <span className="text-lg text-gray-400 font-normal line-through">₹{product.originalPrice}</span>}
            </div>

            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 mb-8">
              <p className="whitespace-pre-wrap">{product.description}</p>
              <p className="mt-4"><strong>Condition:</strong> {product.condition}</p>
            </div>

            <div className="border-t border-gray-200 dark:border-white/10 pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl uppercase shadow-md">
                    {product.sellerName ? product.sellerName[0] : 'U'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{product.sellerName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{product.sellerHostel} Hostel</div>
                  </div>
                </div>
              </div>

              {showContact && !isOwner && !product.isSold && (
                  <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-500/30 animate-fade-in">
                      <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-3">Seller Contact Info</h4>
                      <div className="space-y-3">
                        {product.sellerPhone && (
                             <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400"><Phone size={16} /></div>
                                <div><div className="text-xs text-gray-500 dark:text-gray-400">Mobile</div><div className="text-sm font-mono font-medium text-gray-900 dark:text-white select-all">{product.sellerPhone}</div></div>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400"><Mail size={16} /></div>
                            <div><div className="text-xs text-gray-500 dark:text-gray-400">Email</div><a href={`mailto:${product.sellerEmail}`} className="text-sm font-mono font-medium text-gray-900 dark:text-white hover:underline decoration-indigo-500">{product.sellerEmail || 'Email hidden'}</a></div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-indigo-200 dark:border-indigo-500/20">
                          <p className="text-[10px] text-indigo-700 dark:text-indigo-300 flex items-center gap-1"><ShieldCheck size={12} /> Use caution when meeting. Exchange at hostel reception recommended.</p>
                      </div>
                  </div>
              )}

              <div className="flex flex-col gap-3">
                {isOwner ? (
                  <div className="grid grid-cols-2 gap-3">
                     <Button 
                        fullWidth 
                        variant="outline" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => onEdit(product)}
                     >
                        <Pencil size={18} /> Edit
                     </Button>
                     <Button 
                        fullWidth 
                        variant={product.isSold ? "secondary" : "success"}
                        className="flex items-center justify-center gap-2" 
                        onClick={handleToggleStatus}
                     >
                        {product.isSold ? (
                            <>
                                <RotateCcw size={18} /> Mark Available
                            </>
                        ) : (
                            <>
                                <CheckCircle size={18} /> Mark Sold
                            </>
                        )}
                     </Button>
                  </div>
                ) : product.isSold ? (
                  <div className="p-4 bg-gray-100 dark:bg-white/10 rounded-xl text-center text-gray-500 font-medium">This item has been sold.</div>
                ) : (
                  <>
                    {!showContact && (
                        <Button fullWidth size="lg" onClick={() => setShowContact(true)} className="flex items-center justify-center gap-2"><Phone size={18} /> Contact Seller</Button>
                    )}
                    <Button onClick={handleReport} fullWidth variant="ghost" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"><Flag size={16} className="mr-2" /> Report Listing</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
