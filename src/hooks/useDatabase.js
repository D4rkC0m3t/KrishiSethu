/**
 * 🗄️ DATABASE HOOK
 * 
 * React hook for managing database connection, health, and initialization
 */

import { useState, useEffect, useCallback } from 'react'
import { databaseSetup } from '../lib/database-setup.js'
import { supabaseDiagnostics } from '../lib/supabase.js'

export const useDatabase = () => {
  const [status, setStatus] = useState({
    loading: true,
    connected: false,
    healthy: false,
    initialized: false,
    error: null,
    lastCheck: null
  })

  const [healthData, setHealthData] = useState(null)

  // Check database connectivity
  const checkConnection = useCallback(async () => {
    try {
      const result = await supabaseDiagnostics.quickTest()
      
      setStatus(prev => ({
        ...prev,
        connected: result.success,
        error: result.error,
        lastCheck: new Date().toISOString()
      }))

      return result.success
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        connected: false,
        error: error.message,
        lastCheck: new Date().toISOString()
      }))
      return false
    }
  }, [])

  // Run comprehensive health check
  const checkHealth = useCallback(async () => {
    try {
      const health = await supabaseDiagnostics.healthCheck()
      
      setHealthData(health)
      setStatus(prev => ({
        ...prev,
        healthy: health.overall === 'healthy',
        connected: health.connection?.connected || false,
        error: health.errors.length > 0 ? health.errors[0] : null,
        lastCheck: health.timestamp
      }))

      return health
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        healthy: false,
        error: error.message,
        lastCheck: new Date().toISOString()
      }))
      return null
    }
  }, [])

  // Initialize database
  const initializeDatabase = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }))
      
      const result = await databaseSetup.initializeDatabase()
      
      setStatus(prev => ({
        ...prev,
        initialized: result.success,
        error: result.errors.length > 0 ? result.errors[0] : null,
        loading: false
      }))

      return result
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        initialized: false,
        error: error.message,
        loading: false
      }))
      return { success: false, errors: [error.message] }
    }
  }, [])

  // Validate database schema
  const validateSchema = useCallback(async () => {
    try {
      const result = await databaseSetup.validateSchema()
      
      setStatus(prev => ({
        ...prev,
        healthy: result.valid,
        error: result.errors.length > 0 ? result.errors[0] : null
      }))

      return result
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        healthy: false,
        error: error.message
      }))
      return { valid: false, errors: [error.message] }
    }
  }, [])

  // Auto-initialize on mount
  useEffect(() => {
    const initialize = async () => {
      console.log('🔧 Initializing database connection...')
      
      // First check basic connectivity
      const connected = await checkConnection()
      
      if (connected) {
        // Then validate schema
        const schemaResult = await validateSchema()
        
        if (schemaResult.valid) {
          // Finally run health check
          await checkHealth()
          
          setStatus(prev => ({
            ...prev,
            loading: false,
            initialized: true
          }))
        } else {
          // Try to initialize if schema is invalid
          console.log('⚠️ Schema validation failed, attempting initialization...')
          await initializeDatabase()
        }
      } else {
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to connect to database'
        }))
      }
    }

    initialize()
  }, [checkConnection, validateSchema, checkHealth, initializeDatabase])

  // Retry connection
  const retry = useCallback(async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }))
    
    const connected = await checkConnection()
    if (connected) {
      await checkHealth()
      await validateSchema()
    }
    
    setStatus(prev => ({ ...prev, loading: false }))
  }, [checkConnection, checkHealth, validateSchema])

  return {
    // Status
    status,
    healthData,
    
    // Actions
    checkConnection,
    checkHealth,
    initializeDatabase,
    validateSchema,
    retry,
    
    // Computed properties
    isReady: status.connected && status.healthy && !status.loading,
    hasError: !!status.error,
    needsInitialization: status.connected && !status.healthy && !status.initialized
  }
}

// Hook for database status display
export const useDatabaseStatus = () => {
  const { status, healthData, isReady, hasError } = useDatabase()
  
  const getStatusColor = () => {
    if (status.loading) return 'yellow'
    if (hasError) return 'red'
    if (isReady) return 'green'
    return 'orange'
  }
  
  const getStatusText = () => {
    if (status.loading) return 'Connecting...'
    if (hasError) return `Error: ${status.error}`
    if (isReady) return 'Connected'
    if (status.connected && !status.healthy) return 'Connected (Issues detected)'
    return 'Disconnected'
  }
  
  const getStatusIcon = () => {
    if (status.loading) return '⏳'
    if (hasError) return '❌'
    if (isReady) return '✅'
    if (status.connected) return '⚠️'
    return '🔌'
  }

  return {
    status,
    healthData,
    color: getStatusColor(),
    text: getStatusText(),
    icon: getStatusIcon(),
    isReady,
    hasError,
    lastCheck: status.lastCheck
  }
}

export default useDatabase
