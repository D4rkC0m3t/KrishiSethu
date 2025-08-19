import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://srhfccodjurgnuvuqynp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaGZjY29kanVyZ251dnVxeW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDU0NzksImV4cCI6MjA3MDkyMTQ3OX0.emNVb99D7c6K8CKYqkdDTzKr3Ly6mErKEFMEGbIDN8A'

// Create Supabase client with optimized configuration for auth
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: localStorage, // Explicitly use localStorage
    storageKey: 'krishisethu-auth', // Custom storage key
  },
  realtime: {
    params: {
      eventsPerSecond: 2 // Reduce realtime events to prevent overload
    }
  },
  global: {
    headers: { 'x-application-name': 'krishisethu' }
  },
  // More aggressive timeout and retry settings
  fetch: (url, options = {}) => {
    return fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
  }
})

// Add error handling for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // Clear any cached user data
    localStorage.removeItem('krishisethu-user')
  }
})

export { supabase }
