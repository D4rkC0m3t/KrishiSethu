import { createClient } from '@supabase/supabase-js';

// Prefer runtime debug config saved by the debug page, then .env, then default cloud
function getRuntimeDebugConfig() {
  try {
    const url = window?.localStorage?.getItem('ks_debug_sb_url');
    const key = window?.localStorage?.getItem('ks_debug_sb_anon_key');
    if (url && key) {
      console.log('🛠️ Found runtime Supabase config in localStorage:', { url, key: key.substring(0, 20) + '...' });
      console.log('🚫 TEMPORARILY DISABLED: Using runtime config - forcing cloud config instead');
      // Temporarily disable runtime config to force cloud usage
      // return { url, key };
      return null;
    }
  } catch {}
  return null;
}

const runtime = getRuntimeDebugConfig();

// Cloud Supabase configuration
const supabaseUrl = (runtime?.url) || process.env.REACT_APP_SUPABASE_URL || 'https://srhfccodjurgnuvuqynp.supabase.co';
const supabaseAnonKey = (runtime?.key) || process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaGZjY29kanVyZ251dnVxeW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDU0NzksImV4cCI6MjA3MDkyMTQ3OX0.emNVb99D7c6K8CKYqkdDTzKr3Ly6mErKEFMEGbIDN8A';

// Log connection info for debugging
console.log('☁️ KrishiSethu Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Anon Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('📋 Using runtime config:', !!runtime);
console.log('📋 ENV URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('📋 ENV Key (first 20):', process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

// Create Supabase client with enhanced configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-application-name': 'krishisethu' }
  }
})

// Utility helper to check if Supabase is configured and available
export const isSupabaseConfigured = () => {
  return supabase !== null && supabaseUrl && supabaseAnonKey;
}

// Safe wrapper for Supabase operations
export const withSupabase = (operation) => {
  if (!isSupabaseConfigured()) {
    console.warn('🚧 Supabase operation attempted but not configured');
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  return operation(supabase);
}

// Export the client and components
export { supabase }
export const supabaseAuth = supabase?.auth || null;
export const supabaseStorage = supabase?.storage || null;
export const supabaseRealtime = supabase?.realtime || null;
