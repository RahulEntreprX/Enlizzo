
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, CheckCircle, Lock, Image as ImageIcon, X, AlertTriangle, ArrowRight, Heart, Save } from 'lucide-react';
import { Button } from '../components/Button';
import { Category, Condition, User, Product } from '../types';
import { uploadImage, createListing, updateListing } from '../services/db';

interface ListingFormProps {
  onBack: () => void;
  onSubmit: (product: Product) => void;
  currentUser: User | null;
  isDemo: boolean;
  editProduct?: Product | null;
}

export const ListingForm: React.FC<ListingFormProps> = ({ onBack, onSubmit, currentUser, isDemo, editProduct }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); 
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Changed from priceWarning to priceError for blocking behavior
  const [priceError, setPriceError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    otherCategoryDetail: '', 
    condition: '',
    images: [] as string[],
    isDonation: false,
    tier: 'STANDARD' as 'STANDARD' | 'FOREVER'
  });
  
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);

  // Initialize form for Edit Mode
  useEffect(() => {
    if (editProduct) {
      setFormData({
        title: editProduct.title,
        description: editProduct.description,
        price: editProduct.price === 0 ? '0' : editProduct.price.toString(),
        originalPrice: editProduct.originalPrice ? editProduct.originalPrice.toString() : '',
        category: editProduct.category,
        otherCategoryDetail: '', // Detail extraction logic omitted for simplicity in this pass
        condition: editProduct.condition,
        images: editProduct.images,
        isDonation: editProduct.price === 0,
        tier: editProduct.type || 'STANDARD'
      });
    }
  }, [editProduct]);

  // Real-time Validation Logic
  useEffect(() => {
    if (formData.isDonation) {
      setPriceError(null);
      return;
    }

    const mrp = parseFloat(formData.originalPrice);
    const sp = parseFloat(formData.price);
    const isMrpValid = !isNaN(mrp) && mrp > 0;

    // Requirement 1 & 2: If MRP is valid, check 70% rule
    if (isMrpValid) {
      const limit = Math.floor(mrp * 0.7);
      
      // Requirement 3 & 4: Validate SP against MRP70 in real-time
      if (!isNaN(sp) && sp > limit) {
        setPriceError(`Please set price below 70% of MRP. Try ₹${limit}.`);
      } else {
        setPriceError(null);
      }
    } else {
      // If MRP is invalid, we don't error on price yet (input is disabled), 
      // but we ensure no residual error remains.
      setPriceError(null);
    }
  }, [formData.price, formData.originalPrice, formData.isDonation]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (formData.images.length >= 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    const file = e.target.files[0];

    // 5MB Size Check (Pre-compression check, though compression will fix it usually)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large. Please upload an image less than 10MB.");
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again if needed (though unlikely for uploads)
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length < 1) {
      alert("Please upload at least 1 image");
      return;
    }

    // Blocking Validation
    if (!formData.isDonation && priceError) {
      return;
    }

    // If editing, skip payment flow and update directly
    if (editProduct) {
       handleFinalSubmit('updated_no_payment_needed');
       return;
    }

    if (formData.isDonation) {
      handleFinalSubmit('donation_free');
    } else {
      setStep(2);
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      handleFinalSubmit('pay_dummy_success');
    }, 2000);
  };

  const handleFinalSubmit = async (paymentId: string) => {
    if (!currentUser) return;
    
    // If category is OTHER, append detail to description
    let finalDesc = formData.description;
    if (formData.category === 'Other' && formData.otherCategoryDetail) {
        finalDesc = `[Item Type: ${formData.otherCategoryDetail}]\n\n${formData.description}`;
    }

    const submissionData = {
        ...formData,
        description: finalDesc
    };

    try {
      if (editProduct) {
          await updateListing(editProduct.id, submissionData, isDemo);
          setCreatedProduct({ ...editProduct, ...submissionData } as any); // Quick UI update
          setStep(3);
          setTimeout(() => {
            onSubmit({ ...editProduct, ...submissionData } as any);
          }, 2000);
      } else {
          const product = await createListing(submissionData, currentUser, formData.tier, paymentId, isDemo);
          setCreatedProduct(product);
          setStep(3);
          setTimeout(() => {
            onSubmit(product);
          }, 2000);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save listing. Please try again.");
    }
  };

  // Computed state for UI
  const isMrpValid = !isNaN(parseFloat(formData.originalPrice)) && parseFloat(formData.originalPrice) > 0;

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          {/* Updated Green to Emerald */}
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-6">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{editProduct ? 'Listing Updated!' : 'Listing Published!'}</h2>
          <p className="text-gray-500 dark:text-gray-400">Your item is now live.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative">
      
      <div className="max-w-2xl mx-auto">
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

        <div className="glass-panel rounded-2xl p-8">
          <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{editProduct ? 'Edit Listing' : (step === 1 ? 'List an Item' : 'Select Plan & Pay')}</h1>
          </div>

          {step === 1 ? (
            <form onSubmit={handleDetailsSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Title</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. RD Sharma Math Book"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 p-3 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-all" 
                  value={formData.title} 
                  onChange={e => handleChange('title', e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select 
                    required 
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 p-3 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 dark:text-white shadow-sm transition-all appearance-none" 
                    value={formData.category} 
                    onChange={e => handleChange('category', e.target.value)}
                  >
                    <option value="">Select Category...</option>
                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
                  <select 
                    required 
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 p-3 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 dark:text-white shadow-sm transition-all appearance-none" 
                    value={formData.condition} 
                    onChange={e => handleChange('condition', e.target.value)}
                  >
                    <option value="">Select Condition...</option>
                    {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {formData.category === 'Other' && (
                  <div className="animate-fade-in">
                     <label className="block text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">Please Specify Category</label>
                     <input 
                        required 
                        type="text" 
                        placeholder="e.g. Musical Instrument, Sports Gear" 
                        className="w-full rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 p-3 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white placeholder-indigo-400 dark:placeholder-indigo-300 shadow-sm transition-all" 
                        value={formData.otherCategoryDetail} 
                        onChange={e => handleChange('otherCategoryDetail', e.target.value)} 
                      />
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photos (Max 5)</label>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden group shadow-md border border-gray-200 dark:border-gray-700">
                       <img src={img} alt="" className="h-full w-full object-cover" />
                       <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                    </div>
                  ))}
                  {formData.images.length < 5 && (
                    <div 
                        onClick={() => !isUploading && fileInputRef.current?.click()} 
                        className={`h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-gray-400 transition-all ${isUploading ? 'cursor-not-allowed opacity-50' : 'hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 cursor-pointer'}`}
                    >
                      {isUploading ? <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div> : <Upload size={24} />}
                      <span className="text-xs mt-1 font-medium">{isUploading ? 'Uploading...' : 'Add Photo'}</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Max size 10MB per image (Compressed auto).</p>
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer mb-4 bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors hover:bg-gray-100 dark:hover:bg-slate-800/80">
                  <input type="checkbox" checked={formData.isDonation} onChange={(e) => { handleChange('isDonation', e.target.checked); if(e.target.checked) { handleChange('price', '0'); handleChange('originalPrice', ''); } }} className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" />
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white block">Mark as Donation</span>
                    <span className="text-xs text-gray-500">Free to list. Helping the community.</span>
                  </div>
                </label>

                {!formData.isDonation && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Original MRP First - Logic Requirement 1 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Original MRP (₹)</label>
                        <input 
                          type="number" 
                          min="1" 
                          required={!formData.isDonation}
                          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 p-3 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-all" 
                          value={formData.originalPrice} 
                          onChange={e => handleChange('originalPrice', e.target.value)}
                          placeholder="e.g. 500"
                        />
                      </div>

                      {/* Selling Price Second - Dependent on MRP */}
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${!isMrpValid ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>Selling Price (₹)</label>
                        <input 
                          required={!formData.isDonation} 
                          type="number" 
                          min="1" 
                          disabled={!isMrpValid}
                          className={`w-full rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all shadow-sm ${
                            !isMrpValid 
                              ? 'bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 cursor-not-allowed placeholder-red-400/70' 
                              : 'border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 placeholder-gray-500 dark:placeholder-gray-400'
                          }`} 
                          value={formData.price} 
                          onChange={e => handleChange('price', e.target.value)} 
                          placeholder={!isMrpValid ? "Fill MRP first" : "e.g. 300"}
                        />
                      </div>
                    </div>
                    
                    {/* Blocking Error Popup */}
                    {priceError && (
                      <div className="animate-fade-in p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg flex gap-3 items-start text-sm text-red-800 dark:text-red-200">
                        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
                        <span className="font-medium">{priceError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea 
                  required 
                  rows={4} 
                  placeholder="Describe your item... (Condition, usage history, defects)"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 p-3 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-all resize-none" 
                  value={formData.description} 
                  onChange={e => handleChange('description', e.target.value)} 
                />
              </div>

              <Button 
                fullWidth 
                type="submit" 
                size="lg"
                disabled={!!priceError && !formData.isDonation || isUploading}
                className={`
                  group relative overflow-hidden transition-all duration-300 h-14
                  ${(priceError && !formData.isDonation) || isUploading
                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 border border-gray-200 dark:border-gray-700 opacity-100 cursor-not-allowed shadow-none' // Custom disabled style
                    : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] hover:bg-[position:right_center] shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 border-0 text-white transform hover:-translate-y-1'
                  }
                `}
              >
                 {/* Decorative shimmer for enabled state */}
                 {(!priceError || formData.isDonation) && !isUploading && (
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
                 )}

                 <span className="relative z-10 flex items-center justify-center gap-3 font-bold tracking-wide text-base">
                    {editProduct ? (
                        <>
                          <Save size={18} />
                          <span>Update Listing</span>
                        </>
                    ) : formData.isDonation ? (
                      <>
                        <div className="p-1 bg-white/20 rounded-full"><Heart size={16} className="fill-white" /></div>
                        <span>Publish Donation</span>
                      </>
                    ) : (
                      <>
                        <span>{isUploading ? 'Uploading...' : 'Next: Select Plan'}</span>
                        {!isUploading && (
                            <div className="p-1 bg-white/20 rounded-full group-hover:translate-x-1 transition-transform duration-300 flex items-center justify-center">
                                <ArrowRight size={18} strokeWidth={3} />
                            </div>
                        )}
                      </>
                    )}
                 </span>
              </Button>
            </form>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div onClick={() => handleChange('tier', 'STANDARD')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.tier === 'STANDARD' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Standard</h3>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 my-2">₹39</p>
                    <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                      <li>Live for 30 Days</li>
                      <li>Auto-archives after expiry</li>
                      <li>Standard visibility</li>
                    </ul>
                 </div>
                 <div onClick={() => handleChange('tier', 'FOREVER')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.tier === 'FOREVER' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Forever</h3>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 my-2">₹79</p>
                    <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                      <li>Never expires</li>
                      <li>Priority Support</li>
                      <li>Highlighted Listing</li>
                    </ul>
                 </div>
              </div>

              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                 <div className="flex justify-between mb-2"><span className="text-sm text-gray-500">Base Fee</span><span className="font-mono">₹{formData.tier === 'STANDARD' ? '39.00' : '79.00'}</span></div>
                 <div className="flex justify-between mb-2"><span className="text-sm text-gray-500">GST (18%)</span><span className="font-mono">₹{formData.tier === 'STANDARD' ? '7.02' : '14.22'}</span></div>
                 <div className="border-t border-gray-200 dark:border-white/10 my-2"></div>
                 <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-indigo-600 dark:text-indigo-400">₹{formData.tier === 'STANDARD' ? '46.02' : '93.22'}</span></div>
              </div>

              <Button fullWidth size="lg" onClick={handlePayment} isLoading={isProcessingPayment} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"><Lock size={16} className="mr-2" /> Pay Securely</Button>
              <Button fullWidth variant="ghost" onClick={() => setStep(1)} disabled={isProcessingPayment}>Back to Details</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
