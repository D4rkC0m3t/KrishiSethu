import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://srhfccodjurgnuvuqynp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaGZjY29kanVyZ251dnVxeW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDU0NzksImV4cCI6MjA3MDkyMTQ3OX0.emNVb99D7c6K8CKYqkdDTzKr3Ly6mErKEFMEGbIDN8A'

// Create Supabase client with enhanced configuration
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: localStorage,
    storageKey: 'krishisethu-auth',
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Increased for better real-time updates
    }
  },
  global: {
    headers: { 'x-application-name': 'krishisethu' }
  },
  fetch: (url, options = {}) => {
    return fetch(url, {
      ...options,
      signal: AbortSignal.timeout(30000), // 30 second timeout for better reliability
    });
  }
})

// Enhanced auth state change handling
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    localStorage.removeItem('krishisethu-user')
  }
  if (event === 'SIGNED_IN' && session?.user) {
    console.log('User signed in:', session.user.email)
  }
})

/**
 * Enhanced query helpers with error handling and field mapping support
 */
export const supabaseQuery = {
  // Get all records from a table
  async getAll(table, options = {}) {
    try {
      let query = supabase.from(table).select('*')
      
      if (options.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }
      
      if (options.orderBy) {
        const { field, ascending = true } = options.orderBy
        query = query.order(field, { ascending })
      }
      
      if (options.limit) {
        query = query.limit(options.limit)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error(`Error getting all ${table}:`, error)
      throw error
    }
  },

  // Get record by ID
  async getById(table, id) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error(`Error getting ${table} by ID:`, error)
      throw error
    }
  },

  // Insert new record
  async insert(table, record) {
    try {
      const { data, error } = await supabase
        .from(table)
        .insert(record)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error)
      throw error
    }
  },

  // Update record
  async update(table, id, updates) {
    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error(`Error updating ${table}:`, error)
      throw error
    }
  },

  // Delete record
  async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error)
      throw error
    }
  },

  // Search records
  async search(table, column, searchTerm) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .ilike(column, `%${searchTerm}%`)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error(`Error searching ${table}:`, error)
      throw error
    }
  },

  // Check table access
  async checkTableAccess(tableName) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1)

      return !error
    } catch (error) {
      return false
    }
  },

  // Validate connection
  async validateConnection() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)

      return {
        connected: !error,
        error: error?.message || null,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
}

/**
 * Storage helpers for file management
 */
export const supabaseStorageHelpers = {
  // Upload file
  async uploadFile(bucket, path, file) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  },

  // Get public URL
  getPublicUrl(bucket, path) {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      return data.publicUrl
    } catch (error) {
      console.error('Error getting public URL:', error)
      throw error
    }
  },

  // Delete file
  async deleteFile(bucket, path) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }
}

/**
 * Auth helpers for user management
 */
export const supabaseAuthHelpers = {
  // Sign up
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    }
  },

  // Sign in
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  },

  // Sign out
  async signOut() {
    try {
      console.log('🔓 Attempting to sign out from Supabase...')
      
      // Clear the session
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.warn('⚠️ Supabase signOut error (but continuing):', error)
        // Don't throw error - we still want to clear local state
      }
      
      // Clear any stored tokens/sessions
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.clear()
      }
      
      console.log('✅ Sign out completed')
      return { success: true }
    } catch (error) {
      console.error('❌ Error during sign out:', error)
      
      // Even if there's an error, try to clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.clear()
      }
      
      // Don't throw - we want logout to always succeed locally
      return { success: false, error: error.message }
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      throw error
    }
  }
}

/**
 * Basic diagnostics (enhanced version in database-setup.js)
 */
export const supabaseDiagnostics = {
  // Quick connectivity test
  async quickTest() {
    try {
      const result = await supabaseQuery.validateConnection()
      return {
        success: result.connected,
        timestamp: result.timestamp,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  },

  // Basic health check
  async healthCheck() {
    try {
      const connectivity = await this.quickTest()
      
      return {
        timestamp: new Date().toISOString(),
        connection: {
          connected: connectivity.success,
          error: connectivity.error
        },
        overall: connectivity.success ? 'connected' : 'error',
        errors: connectivity.error ? [connectivity.error] : []
      }
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        overall: 'error',
        errors: [error.message],
        connection: { connected: false, error: error.message }
      }
    }
  }
}

export { supabase }
