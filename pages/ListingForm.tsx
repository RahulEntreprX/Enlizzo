
import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, CheckCircle, Lock, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '../components/Button';
import { Category, Condition, User } from '../types';
import { uploadImage, createListing } from '../services/db';

interface ListingFormProps {
  onBack: () => void;
  onSubmit: (data: any) => void;
  currentUser: User | null;
}

export const ListingForm: React.FC<ListingFormProps> = ({ onBack, onSubmit, currentUser }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); 
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (formData.images.length >= 5) {
      alert("Maximum 5 images allowed");
      return;
    }
    setIsUploading(true);
    const file = e.target.files[0];
    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload image. Max size 5MB.");
    } finally {
      setIsUploading(false);
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
    if(formData.images.length < 1) {
      alert("Please upload at least 1 image");
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
      await createListing(submissionData, currentUser, formData.tier, paymentId);
      setStep(3);
      setTimeout(() => {
        onSubmit(formData);
      }, 2000);
    } catch (error) {
      console.error(error);
      alert("Failed to create listing. Please try again.");
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Listing Published!</h2>
          <p className="text-gray-500 dark:text-gray-400">Your item is now live.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative">
      <button onClick={onBack} className="fixed top-20 left-4 md:left-8 z-30 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-lg transition-all hover:-translate-x-1">
        <ArrowLeft size={24} />
      </button>

      <div className="max-w-2xl mx-auto pt-8">
        <div className="glass-panel rounded-2xl p-8">
          <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{step === 1 ? 'List an Item' : 'Select Plan & Pay'}</h1>
          </div>

          {step === 1 ? (
            <form onSubmit={handleDetailsSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Title</label>
                <input required type="text" className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white" value={formData.title} onChange={e => handleChange('title', e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select required className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white" value={formData.category} onChange={e => handleChange('category', e.target.value)}>
                    <option value="">Select...</option>
                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
                  <select required className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white" value={formData.condition} onChange={e => handleChange('condition', e.target.value)}>
                    <option value="">Select...</option>
                    {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {formData.category === 'Other' && (
                  <div className="animate-fade-in">
                     <label className="block text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">Please Specify Category</label>
                     <input required type="text" placeholder="e.g. Musical Instrument, Sports Gear" className="w-full rounded-xl border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white" value={formData.otherCategoryDetail} onChange={e => handleChange('otherCategoryDetail', e.target.value)} />
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photos (Max 5)</label>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden group">
                       <img src={img} alt="" className="h-full w-full object-cover" />
                       <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                    </div>
                  ))}
                  {formData.images.length < 5 && (
                    <div onClick={() => fileInputRef.current?.click()} className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-500 cursor-pointer transition-colors">
                      {isUploading ? <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div> : <Upload size={24} />}
                      <span className="text-xs mt-1">Add Photo</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer mb-4 bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10">
                  <input type="checkbox" checked={formData.isDonation} onChange={(e) => { handleChange('isDonation', e.target.checked); if(e.target.checked) { handleChange('price', '0'); handleChange('originalPrice', ''); } }} className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500" />
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white block">Mark as Donation</span>
                    <span className="text-xs text-gray-500">Free to list. Helping the community.</span>
                  </div>
                </label>

                {!formData.isDonation && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price (₹)</label>
                      <input required type="number" min="1" className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white" value={formData.price} onChange={e => handleChange('price', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Original MRP (₹)</label>
                      <input type="number" min="1" className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white" value={formData.originalPrice} onChange={e => handleChange('originalPrice', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea required rows={4} className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white" value={formData.description} onChange={e => handleChange('description', e.target.value)} />
              </div>

              <Button fullWidth type="submit" size="lg">{formData.isDonation ? 'Publish Donation' : 'Next: Select Plan'}</Button>
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
