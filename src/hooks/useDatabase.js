/**
 * 🗄️ DATABASE HOOK
 * 
 * React hook for managing database connection, health, and initialization
 * Enhanced version with camelCase view support and comprehensive diagnostics
 */

import { useState, useEffect, useCallback } from 'react'
import { databaseSetup, supabaseDiagnostics } from '../lib/database-setup.js'

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
        healthy: health.overall === 'healthy' || health.overall === 'needs_data',
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

  // Get database statistics
  const getDatabaseStats = useCallback(async () => {
    try {
      return await databaseSetup.getDatabaseStats()
    } catch (error) {
      console.error('Failed to get database stats:', error)
      return null
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
          const initResult = await initializeDatabase()
          
          if (initResult.success) {
            // Re-run health check after initialization
            await checkHealth()
          }
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
    getDatabaseStats,
    retry,
    
    // Computed properties
    isReady: status.connected && status.healthy && !status.loading,
    hasError: !!status.error,
    needsInitialization: status.connected && !status.healthy && !status.initialized,
    isLoading: status.loading
  }
}

// Hook for database status display with enhanced UI states
export const useDatabaseStatus = () => {
  const { status, healthData, isReady, hasError, isLoading } = useDatabase()
  
  const getStatusColor = () => {
    if (isLoading) return 'yellow'
    if (hasError) return 'red'
    if (isReady) return 'green'
    if (status.connected && !status.healthy) return 'orange'
    return 'gray'
  }
  
  const getStatusText = () => {
    if (isLoading) return 'Connecting...'
    if (hasError) return `Error: ${status.error}`
    if (isReady) return 'Connected & Healthy'
    if (status.connected && !status.healthy) return 'Connected (Issues detected)'
    return 'Disconnected'
  }
  
  const getStatusIcon = () => {
    if (isLoading) return '⏳'
    if (hasError) return '❌'
    if (isReady) return '✅'
    if (status.connected && !status.healthy) return '⚠️'
    return '🔌'
  }

  const getDetailedStatus = () => {
    if (!healthData) return null

    return {
      connection: healthData.connection?.connected ? 'Connected' : 'Disconnected',
      schema: healthData.schema?.valid ? 'Valid' : 'Invalid',
      data: healthData.data?.totalRecords > 0 ? `${healthData.data.totalRecords} records` : 'No data',
      views: healthData.data?.views ? Object.values(healthData.data.views).filter(v => v.available).length : 0,
      recommendations: healthData.recommendations || []
    }
  }

  return {
    status,
    healthData,
    color: getStatusColor(),
    text: getStatusText(),
    icon: getStatusIcon(),
    detailed: getDetailedStatus(),
    isReady,
    hasError,
    isLoading,
    lastCheck: status.lastCheck
  }
}

// Hook for database operations with error handling
export const useDatabaseOperations = () => {
  const { isReady, hasError, retry } = useDatabase()
  const [operationStatus, setOperationStatus] = useState({
    loading: false,
    error: null,
    lastOperation: null
  })

  const executeOperation = useCallback(async (operation, operationName = 'Database operation') => {
    if (!isReady) {
      throw new Error('Database is not ready')
    }

    setOperationStatus({
      loading: true,
      error: null,
      lastOperation: operationName
    })

    try {
      const result = await operation()
      
      setOperationStatus({
        loading: false,
        error: null,
        lastOperation: operationName
      })

      return result
    } catch (error) {
      console.error(`${operationName} failed:`, error)
      
      setOperationStatus({
        loading: false,
        error: error.message,
        lastOperation: operationName
      })

      throw error
    }
  }, [isReady])

  return {
    executeOperation,
    operationStatus,
    isReady,
    hasError,
    retry
  }
}

export default useDatabase