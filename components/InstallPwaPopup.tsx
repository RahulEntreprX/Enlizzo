import React, { useEffect, useState } from 'react';
import { Download, X, ShieldCheck } from 'lucide-react';
import { Button } from './Button';

export const InstallPwaPopup: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isMounted || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center items-end pointer-events-none">
      <div className="pointer-events-auto max-w-md w-full glass-panel bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl p-5 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg text-white">
              <Download size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Install ENLIZZO</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Add to home screen for a better experience.</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
             <ShieldCheck size={12} className="text-green-500" />
             <span>Verified Campus App • 2MB</span>
          </div>
          <Button 
            onClick={handleInstallClick} 
            fullWidth 
            className="shadow-indigo-500/20"
          >
            Install App
          </Button>
        </div>
      </div>
    </div>
  );
};