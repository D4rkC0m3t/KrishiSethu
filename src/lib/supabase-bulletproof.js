import { createClient } from '@supabase/supabase-js';

// Centralized env vars
const requiredEnvVars = {
  url: process.env.REACT_APP_SUPABASE_URL,
  key: process.env.REACT_APP_SUPABASE_ANON_KEY,
};

console.log('🔧 Supabase Configuration Check:');
console.log('   URL provided:', !!requiredEnvVars.url);
console.log('   Key provided:', !!requiredEnvVars.key);
console.log('   Environment:', process.env.NODE_ENV);

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([name]) => name);

// Mock functions for when Supabase is not configured
const createMockHelpers = () => ({
  getAll: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
  getById: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  update: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  delete: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  search: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
  checkTableAccess: async () => ({ accessible: false, error: 'Supabase not configured' }),
  getTableInfo: async () => ({ accessible: false, error: 'Supabase not configured' }),
  validateConnection: async () => ({ connected: false, error: 'Supabase not configured' })
});

const createMockStorageHelpers = () => ({
  uploadFile: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  getPublicUrl: () => '',
  deleteFile: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  listFiles: async () => ({ data: [], error: { message: 'Supabase not configured' } })
});

const createMockAuthHelpers = () => ({
  signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  signIn: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  signOut: async () => ({ error: { message: 'Supabase not configured' } }),
  getCurrentUser: () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
  getCurrentSession: () => ({ data: { session: null }, error: { message: 'Supabase not configured' } })
});

const createMockDiagnostics = () => ({
  healthCheck: async () => ({ overall: 'failed', errors: ['Supabase not configured'] }),
  quickTest: async () => ({ success: false, error: 'Supabase not configured' })
});

// Check for missing variables
if (missingVars.length > 0) {
  console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
  console.error('👉 Fix by creating a .env.local with:');
  console.error('   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   REACT_APP_SUPABASE_ANON_KEY=your-anon-public-key');
  console.error('');
  console.error('🔗 Get credentials from: https://supabase.com/dashboard/project/your-project/settings/api');
  console.error('⚠️  Remember to restart your dev server after adding .env.local');

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `Missing Supabase configuration: ${missingVars.join(', ')}`
    );
  } else {
    // In dev, use mock client so app doesn't crash
    console.warn('🚧 Running in development mode with missing Supabase config');
    console.warn('🚧 Some features will not work until you configure Supabase');
    
    // Export mock implementations
    export const supabase = null;
    export const supabaseAuth = null;
    export const supabaseStorage = null;
    export const supabaseRealtime = null;
    export const supabaseQuery = createMockHelpers();
    export const supabaseStorageHelpers = createMockStorageHelpers();
    export const supabaseAuthHelpers = createMockAuthHelpers();
    export const supabaseDiagnostics = createMockDiagnostics();
    export default null;
  }
} else {
  // Configuration exists, validate it
  const { url: supabaseUrl, key: supabaseAnonKey } = requiredEnvVars;

  // Additional validation for URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error('❌ Invalid Supabase URL format:', supabaseUrl);
    console.error('✅ Expected format: https://your-project-id.supabase.co');
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid Supabase URL format. Please check REACT_APP_SUPABASE_URL.');
    } else {
      console.warn('🚧 Invalid URL format, running with mock client');
      export const supabase = null;
      export const supabaseAuth = null;
      export const supabaseStorage = null;
      export const supabaseRealtime = null;
      export const supabaseQuery = createMockHelpers();
      export const supabaseStorageHelpers = createMockStorageHelpers();
      export const supabaseAuthHelpers = createMockAuthHelpers();
      export const supabaseDiagnostics = createMockDiagnostics();
      export default null;
    }
  }

  // Validate key format (basic check)
  if (supabaseAnonKey.length < 100 || !supabaseAnonKey.startsWith('eyJ')) {
    console.error('❌ Invalid Supabase anon key format');
    console.error('✅ Expected: JWT token starting with "eyJ" (anon/public key, NOT service_role)');
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid Supabase anon key format. Please check REACT_APP_SUPABASE_ANON_KEY.');
    } else {
      console.warn('🚧 Invalid key format, running with mock client');
      export const supabase = null;
      export const supabaseAuth = null;
      export const supabaseStorage = null;
      export const supabaseRealtime = null;
      export const supabaseQuery = createMockHelpers();
      export const supabaseStorageHelpers = createMockStorageHelpers();
      export const supabaseAuthHelpers = createMockAuthHelpers();
      export const supabaseDiagnostics = createMockDiagnostics();
      export default null;
    }
  }

  console.log('✅ Supabase configuration validated successfully');

  // Create Supabase client with enhanced configuration for better reliability
  export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'krishisethu-inventory@1.0.0'
      }
    },
    // Add timeout and retry configuration
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // Set reasonable timeout for database operations
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
    }
  });

  // Export the client components
  export const supabaseAuth = supabase.auth;
  export const supabaseStorage = supabase.storage;
  export const supabaseRealtime = supabase.realtime;
  export default supabase;
}
