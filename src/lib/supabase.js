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

// Supabase configuration - Using hardcoded values that work
const supabaseUrl = (runtime?.url) || process.env.REACT_APP_SUPABASE_URL || 'https://lnljcgttcdhrduixirgf.supabase.co';
const supabaseAnonKey = (runtime?.key) || process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo';

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ SUPABASE SETUP ERROR: Missing environment variables');
  console.error('📝 Please add these to your .env file:');
  console.error('   REACT_APP_SUPABASE_URL=https://your-project.supabase.co');
  console.error('   REACT_APP_SUPABASE_ANON_KEY=your-anon-key');
  console.error('🔗 Get them from: https://supabase.com/dashboard/project/your-project/settings/api');
}

// Log connection info for debugging
console.log('☁️ KrishiSethu Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Anon Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('📋 Using runtime config:', !!runtime);
console.log('📋 ENV URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('📋 ENV Key (first 20):', process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

// Create Supabase client with minimal configuration (like working test)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
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
