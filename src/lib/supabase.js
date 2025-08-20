import { createClient } from '@supabase/supabase-js'

// Supabase configuration - FRESH DATABASE
const supabaseUrl = 'https://srhfccodjurgnuvuqynp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaGZjY29kanVyZ251dnVxeW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDU0NzksImV4cCI6MjA3MDkyMTQ3OX0.emNVb99D7c6K8CKYqkdDTzKr3Ly6mErKEFMEGbIDN8A'

// Always use the anon key for client-side operations
// This ensures RLS works consistently across environments
const activeKey = supabaseKey

// Create Supabase client with enhanced configuration for better reliability
const supabase = createClient(supabaseUrl, activeKey, {
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
  // Schema config removed - was causing "schema must be public" error
  // Supabase will default to 'public' schema which is correct
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

  // Update record with automatic timestamp handling
  update: async (table, id, updates) => {
    // Ensure updated_at is always set to current timestamp
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from(table)
      .update(updatesWithTimestamp)
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
  },

  // Check if table exists and is accessible
  checkTableAccess: async (tableName) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1)

      return {
        accessible: !error,
        error: error?.message || null,
        tableName
      }
    } catch (err) {
      return {
        accessible: false,
        error: err.message,
        tableName
      }
    }
  },

  // Get table schema information (alternative approach)
  getTableInfo: async (tableName) => {
    try {
      // Try to get a sample record to understand the structure
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        return { accessible: false, error: error.message, columns: [] }
      }

      const columns = data && data.length > 0 ? Object.keys(data[0]) : []
      return {
        accessible: true,
        error: null,
        columns,
        sampleData: data?.[0] || null
      }
    } catch (err) {
      return {
        accessible: false,
        error: err.message,
        columns: []
      }
    }
  },

  // Validate database connectivity
  validateConnection: async () => {
    try {
      // Try to access a simple table to validate connection
      const { data, error } = await supabase
        .from('categories')
        .select('id')
        .limit(1)

      return {
        connected: !error,
        error: error?.message || null,
        timestamp: new Date().toISOString()
      }
    } catch (err) {
      return {
        connected: false,
        error: err.message,
        timestamp: new Date().toISOString()
      }
    }
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

// Database health check and diagnostics
export const supabaseDiagnostics = {
  // Comprehensive health check
  healthCheck: async () => {
    const results = {
      timestamp: new Date().toISOString(),
      overall: 'unknown',
      connection: null,
      tables: {},
      performance: {},
      errors: []
    }

    try {
      // Test basic connectivity
      const connectionTest = await supabaseQuery.validateConnection()
      results.connection = connectionTest

      if (!connectionTest.connected) {
        results.overall = 'failed'
        results.errors.push('Database connection failed')
        return results
      }

      // Test critical tables
      const criticalTables = ['categories', 'brands', 'suppliers', 'customers', 'products']
      const tableTests = await Promise.all(
        criticalTables.map(async (table) => {
          const startTime = Date.now()
          const access = await supabaseQuery.checkTableAccess(table)
          const endTime = Date.now()

          return {
            table,
            accessible: access.accessible,
            error: access.error,
            responseTime: endTime - startTime
          }
        })
      )

      // Process table results
      let accessibleTables = 0
      tableTests.forEach(test => {
        results.tables[test.table] = {
          accessible: test.accessible,
          responseTime: test.responseTime,
          error: test.error
        }

        if (test.accessible) {
          accessibleTables++
        } else {
          results.errors.push(`Table ${test.table} not accessible: ${test.error}`)
        }
      })

      // Calculate performance metrics
      const responseTimes = tableTests.map(t => t.responseTime)
      results.performance = {
        averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        maxResponseTime: Math.max(...responseTimes),
        minResponseTime: Math.min(...responseTimes),
        accessibleTables: accessibleTables,
        totalTables: criticalTables.length
      }

      // Determine overall health
      if (accessibleTables === criticalTables.length) {
        results.overall = 'healthy'
      } else if (accessibleTables >= criticalTables.length * 0.6) {
        results.overall = 'degraded'
      } else {
        results.overall = 'failed'
      }

    } catch (error) {
      results.overall = 'failed'
      results.errors.push(`Health check failed: ${error.message}`)
    }

    return results
  },

  // Quick connectivity test
  quickTest: async () => {
    try {
      const start = Date.now()
      const { data, error } = await supabase
        .from('categories')
        .select('id')
        .limit(1)
      const end = Date.now()

      return {
        success: !error,
        responseTime: end - start,
        error: error?.message || null,
        timestamp: new Date().toISOString()
      }
    } catch (err) {
      return {
        success: false,
        responseTime: null,
        error: err.message,
        timestamp: new Date().toISOString()
      }
    }
  }
}

export default supabase
