
import { createClient } from '@supabase/supabase-js';

// Safe access to env variables for various environments
const getEnv = (key: string) => {
  try {
    // Check if import.meta exists and has env
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || '';
    }
    // Fallback for process.env if available
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

// === PERMANENT FIX FOR MAGIC LINK REFRESH LOOP ===
// If the user refreshes the page while the URL still contains an #access_token,
// Supabase will try to reuse it, fail (because it's one-time use), and kill the persistent session.
// We must detect if this is a RELOAD and sanitize the URL before Supabase sees it.
if (typeof window !== 'undefined') {
  const entries = window.performance?.getEntriesByType?.("navigation") || [];
  const navType = entries.length > 0 ? (entries[0] as any).type : '';
  const isReload = navType === 'reload' || (window.performance?.navigation?.type === 1);
  
  const hash = window.location.hash;
  
  // Case 1: Reload with access_token (Stale token causing infinite load/logout)
  // Case 2: Error codes (Explicit errors from Supabase)
  if (
    (isReload && hash && (hash.includes('access_token') || hash.includes('type=magiclink'))) ||
    (hash && (hash.includes('error_code=otp_expired') || hash.includes('error=access_denied')))
  ) {
    console.warn("Detected stale auth hash on reload. Sanitizing URL to preserve session.");
    try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (e) {
        console.warn("Failed to sanitize URL", e);
    }
  }
}

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_KEY');

// Fallback for development/demo if keys are missing.
const supabaseUrl = envUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = envKey || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, 
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const isSupabaseConfigured = () => {
  return envUrl && envKey && envUrl !== 'https://placeholder.supabase.co';
};
