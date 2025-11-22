
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || '';
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key] || '';
    }
  } catch {
    return '';
  }
  return '';
};

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_KEY');

// Fallback for development/demo if keys are missing.
const supabaseUrl = envUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = envKey || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Critical for maintaining login across refreshes
    autoRefreshToken: true, // Critical for keeping the session alive
    detectSessionInUrl: true, // Required for Magic Links
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
});

export const isSupabaseConfigured = () => {
  return envUrl && envKey && envUrl !== 'https://placeholder.supabase.co';
};
