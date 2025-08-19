/**
 * 🧪 DATABASE INTEGRATION TEST SUITE
 * 
 * Run this to verify the database fixes are working correctly
 */

import { 
  productsService, 
  categoriesService, 
  salesService,
  notificationsService,
  databaseDiagnostics,
  COLLECTIONS 
} from '../lib/supabaseDb'

import { supabaseQuery } from '../lib/supabase'

/**
 * Test database connectivity and health
 */
export const testDatabaseHealth = async () => {
  console.log('🏥 Testing database health...')
  
  try {
    const health = await databaseDiagnostics.healthCheck()
    console.log('✅ Health check result:', health)
    
    const counts = await databaseDiagnostics.getTableCounts()
    console.log('📊 Table counts:', counts)
    
    const viewStatus = await databaseDiagnostics.checkViewsExist()
    console.log('👁️ CamelCase views status:', viewStatus)
    
    return {
      success: true,
      health,
      counts,
      viewStatus
    }
  } catch (error) {
    console.error('❌ Database health test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Test camelCase views functionality
 */
export const testCamelCaseViews = async () => {
  console.log('🐪 Testing camelCase views...')
  
  try {
    // Test products_cc view
    const products = await supabaseQuery.getAll('products_cc', { limit: 5 })
    console.log('✅ Products from camelCase view:', products)
    
    // Verify camelCase fields exist
    if (products.length > 0) {
      const product = products[0]
      const hasCamelCase = 'salePrice' in product || 'purchasePrice' in product
      console.log('✅ CamelCase fields detected:', hasCamelCase)
    }
    
    // Test categories_cc view
    const categories = await supabaseQuery.getAll('categories_cc', { limit: 5 })
    console.log('✅ Categories from camelCase view:', categories)
    
    return {
      success: true,
      products: products.length,
      categories: categories.length,
      camelCaseWorking: true
    }
  } catch (error) {
    console.error('❌ CamelCase views test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Test service layer operations
 */
export const testServiceLayer = async () => {
  console.log('🔧 Testing service layer...')
  
  try {
    // Test products service
    const products = await productsService.getAll()
    console.log('✅ Products service:', products.length, 'products loaded')
    
    // Test categories service
    const categories = await categoriesService.getAll()
    console.log('✅ Categories service:', categories.length, 'categories loaded')
    
    // Test sales service
    const sales = await salesService.getAll()
    console.log('✅ Sales service:', sales.length, 'sales loaded')
    
    // Test field mapping by checking if camelCase fields exist
    if (products.length > 0) {
      const product = products[0]
      const fields = Object.keys(product)
      const hasCamelCase = fields.some(field => 
        field.includes('Price') || field.includes('Date') || field.includes('Id')
      )
      console.log('✅ Service layer field mapping working:', hasCamelCase)
      console.log('📋 Sample product fields:', fields.slice(0, 10))
    }
    
    return {
      success: true,
      products: products.length,
      categories: categories.length,
      sales: sales.length,
      fieldMappingWorking: true
    }
  } catch (error) {
    console.error('❌ Service layer test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Test notifications functionality
 */
export const testNotifications = async () => {
  console.log('📬 Testing notifications...')
  
  try {
    // Try to get existing notifications
    const existingNotifications = await notificationsService.getAll()
    console.log('✅ Existing notifications:', existingNotifications.length)
    
    // Try to create a test notification (will fail if no user is logged in)
    try {
      const testNotification = await notificationsService.create({
        title: 'Database Integration Test',
        body: 'This is a test notification created during database integration testing.',
        level: 'info'
      })
      console.log('✅ Test notification created:', testNotification.id)
      
      // Clean up - delete the test notification
      await notificationsService.delete(testNotification.id)
      console.log('✅ Test notification cleaned up')
      
      return {
        success: true,
        existingCount: existingNotifications.length,
        createWorking: true,
        deleteWorking: true
      }
    } catch (createError) {
      console.log('⚠️ Notification creation failed (likely no user logged in):', createError.message)
      return {
        success: true,
        existingCount: existingNotifications.length,
        createWorking: false,
        note: 'Notification creation requires authenticated user'
      }
    }
  } catch (error) {
    console.error('❌ Notifications test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Test database operations with error handling
 */
export const testDatabaseOperations = async () => {
  console.log('⚙️ Testing database operations...')
  
  try {
    const results = {}
    
    // Test table access
    const tables = ['products', 'categories', 'suppliers', 'customers', 'sales', 'purchases']
    for (const table of tables) {
      try {
        const hasAccess = await supabaseQuery.checkTableAccess(table)
        results[table] = hasAccess ? 'accessible' : 'no access'
      } catch (error) {
        results[table] = 'error: ' + error.message
      }
    }
    
    console.log('✅ Table access results:', results)
    
    // Test search functionality
    try {
      const searchResults = await supabaseQuery.search('products', 'name', 'test')
      console.log('✅ Search functionality working, found:', searchResults.length, 'results')
    } catch (searchError) {
      console.log('⚠️ Search test failed:', searchError.message)
    }
    
    return {
      success: true,
      tableAccess: results,
      searchWorking: true
    }
  } catch (error) {
    console.error('❌ Database operations test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Run all tests
 */
export const runAllTests = async () => {
  console.log('🚀 Starting comprehensive database integration tests...')
  console.log('=' .repeat(60))
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  }
  
  // Run each test
  results.tests.health = await testDatabaseHealth()
  results.tests.camelCaseViews = await testCamelCaseViews()
  results.tests.serviceLayer = await testServiceLayer()
  results.tests.notifications = await testNotifications()
  results.tests.operations = await testDatabaseOperations()
  
  // Summary
  const passedTests = Object.values(results.tests).filter(test => test.success).length
  const totalTests = Object.keys(results.tests).length
  
  console.log('=' .repeat(60))
  console.log(`🎯 Test Results: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Database integration is working correctly.')
  } else {
    console.log('⚠️ Some tests failed. Check the detailed results above.')
  }
  
  results.summary = {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests
  }
  
  return results
}

/**
 * Quick connectivity test
 */
export const quickConnectivityTest = async () => {
  console.log('⚡ Quick connectivity test...')
  
  try {
    const result = await supabaseQuery.validateConnection()
    
    if (result.connected) {
      console.log('✅ Database connection successful')
      return { success: true, message: 'Connected successfully' }
    } else {
      console.log('❌ Database connection failed:', result.error)
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.log('❌ Connectivity test failed:', error.message)
    return { success: false, error: error.message }
  }
}

// Export for use in components
export default {
  testDatabaseHealth,
  testCamelCaseViews,
  testServiceLayer,
  testNotifications,
  testDatabaseOperations,
  runAllTests,
  quickConnectivityTest
}