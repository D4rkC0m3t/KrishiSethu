import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://zwwmfgexghsniecdpypz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3d21mZ2V4Z2hzbmllY2RweXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNTUzNTgsImV4cCI6MjA3MDczMTM1OH0._tFBb71TYx4U1VkCq9i2VTpQuNpHPV_zpdctQQOy8Yk'

// Create Supabase client with enhanced configuration
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Export the client
export { supabase }

// Helper functions for common operations
export const supabaseAuth = supabase.auth
export const supabaseStorage = supabase.storage
export const supabaseRealtime = supabase.realtime

// Database helper functions
export const supabaseQuery = {
  // Get all records from a table
  getAll: async (table) => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
    return { data, error }
  },

  // Get record by ID
  getById: async (table, id) => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  // Insert new record
  insert: async (table, record) => {
    const { data, error } = await supabase
      .from(table)
      .insert(record)
      .select()
    return { data, error }
  },

  // Update record
  update: async (table, id, updates) => {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  // Delete record
  delete: async (table, id) => {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Search records
  search: async (table, column, searchTerm) => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .ilike(column, `%${searchTerm}%`)
    return { data, error }
  }
}

// Storage helper functions
export const supabaseStorageHelpers = {
  // Upload file
  uploadFile: async (bucket, path, file) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)
    return { data, error }
  },

  // Get public URL
  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    return data.publicUrl
  },

  // Delete file
  deleteFile: async (bucket, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path])
    return { data, error }
  },

  // List files
  listFiles: async (bucket, folder = '') => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder)
    return { data, error }
  }
}

// Auth helper functions
export const supabaseAuthHelpers = {
  // Sign up
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  // Sign in
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getCurrentUser: () => {
    return supabase.auth.getUser()
  },

  // Get current session
  getCurrentSession: () => {
    return supabase.auth.getSession()
  }
}

export default supabase
