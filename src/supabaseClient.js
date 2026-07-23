import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Detect if running inside Capacitor (Android/iOS native app)
const isCapacitor = typeof window !== 'undefined' &&
  (window.Capacitor !== undefined || window.location.protocol === 'capacitor:');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use localStorage so sessions persist across app restarts
    storage: window.localStorage,
    // Auto-refresh JWT tokens before they expire
    autoRefreshToken: true,
    // Keep user logged in between sessions
    persistSession: true,
    // CRITICAL for Capacitor: Don't try to extract tokens from URL
    // (Capacitor URLs use custom schemes, not standard http)
    detectSessionInUrl: false,
  }
});
