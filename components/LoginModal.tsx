
import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2, CheckCircle, Link as LinkIcon, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './Button';
import { ALLOWED_DOMAINS } from '../constants';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDemoLogin?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onDemoLogin }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE');
  const [error, setError] = useState<string | null>(null);
  
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => emailInputRef.current?.focus(), 100);
    } else {
      setTimeout(() => {
        setEmail('');
        setStatus('IDLE');
        setError(null);
      }, 300);
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus('LOADING');

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Domain Validation (Strict)
    const isTest = trimmedEmail.includes('test') || trimmedEmail.includes('admin'); 
    const isValidDomain = ALLOWED_DOMAINS.some(domain => trimmedEmail.endsWith(domain));

    if (!isValidDomain && !isTest) {
      setError('Access restricted. Please use a valid IIT email address.');
      setStatus('IDLE');
      return;
    }

    try {
      // 2. Send Magic Link
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: { 
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin, // Points back to current page
        }
      });

      if (error) {
        if (error.status === 429) {
            throw new Error("Too many attempts. Please wait a minute.");
        }
        throw error;
      }
      
      // 3. Success State
      setStatus('SUCCESS');
      
      // 4. Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || 'Failed to send login link.');
      setStatus('IDLE');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10 transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors z-20"
        >
          <X size={20} />
        </button>

        <div className="p-8 relative z-10">
          
          {status === 'SUCCESS' ? (
            <div className="text-center py-8 animate-slide-up">
              <div className="mx-auto mb-6 h-20 w-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Magic Link Sent!</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Check your inbox at <span className="font-semibold text-indigo-600 dark:text-indigo-400">{email}</span>
              </p>
              <p className="text-xs text-gray-400">Closing automatically...</p>
            </div>
          ) : (
            <>
              {/* Header Icon */}
              <div className="flex justify-center mb-6">
                 <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 dark:border-white/10 group">
                    {status === 'LOADING' ? (
                      <Loader2 size={36} className="animate-spin text-indigo-500" />
                    ) : (
                      <LinkIcon size={36} className="group-hover:rotate-45 transition-transform duration-300" />
                    )}
                 </div>
              </div>

              {/* Title */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                  Campus Login
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 px-4 leading-relaxed">
                  Enter your IIT email. We'll land you in your campus marketplace instantly.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-300 text-sm flex items-start gap-3 animate-slide-up">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                     <div className="font-bold mb-1">Login Error</div>
                     <div>{error}</div>
                     {error.includes("Too many attempts") && onDemoLogin && (
                        <button onClick={onDemoLogin} className="mt-2 text-xs font-bold underline hover:text-red-500 dark:hover:text-red-200">
                           Skip wait time (Use Demo Account)
                        </button>
                     )}
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                    IIT Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      ref={emailInputRef}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. student@iitd.ac.in"
                      disabled={status === 'LOADING'}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 transition-all font-medium text-base shadow-sm disabled:opacity-60"
                    />
                  </div>
                </div>
                
                <Button 
                  fullWidth 
                  size="lg" 
                  type="submit" 
                  disabled={status === 'LOADING'}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 py-4 rounded-xl text-base font-semibold tracking-wide flex items-center justify-center gap-2 group"
                >
                  {status === 'LOADING' ? 'Connecting...' : 'Access Marketplace'}
                  {!status && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </Button>
                
                <div className="flex items-center justify-between mt-6 opacity-60 text-[10px] font-mono uppercase">
                   <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                     <ShieldCheck size={12} />
                     <span>Secure Campus Auth</span>
                   </div>
                   {onDemoLogin && (
                      <button 
                        type="button" 
                        onClick={onDemoLogin} 
                        className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                      >
                        <UserCircle size={12} />
                        <span>Continue as Guest (Demo)</span>
                      </button>
                   )}
                </div>
              </form>
            </>
          )}
        </div>
        
        {/* Loading Bar */}
        {status === 'LOADING' && (
          <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 animate-beam-horizontal w-full z-30"></div>
        )}
      </div>
    </div>
  );
};
