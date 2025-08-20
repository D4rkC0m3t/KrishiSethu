import { createClient } from '@supabase/supabase-js';

// Cloud Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://srhfccodjurgnuvuqynp.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaGZjY29kanVyZ251dnVxeW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDU0NzksImV4cCI6MjA3MDkyMTQ3OX0.emNVb99D7c6K8CKYqkdDTzKr3Ly6mErKEFMEGbIDN8A';

// Log connection info for debugging
console.log('☁️ KrishiSethu connected to Supabase Cloud:', supabaseUrl);
console.log('🔧 Environment:', process.env.NODE_ENV);

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
