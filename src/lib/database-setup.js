/**
 * 🗄️ DATABASE SETUP AND VALIDATION UTILITIES
 * 
 * This module provides utilities for setting up, validating, and maintaining
 * the KrishiSethu Inventory Management database structure.
 */

import { supabase, supabaseQuery, supabaseDiagnostics } from './supabase.js'

// Expected database schema
export const EXPECTED_TABLES = {
  users: {
    required: true,
    description: 'User management and authentication',
    criticalColumns: ['id', 'email', 'name', 'role', 'is_active']
  },
  categories: {
    required: true,
    description: 'Product categories',
    criticalColumns: ['id', 'name', 'description', 'is_active', 'sort_order']
  },
  brands: {
    required: true,
    description: 'Product brands',
    criticalColumns: ['id', 'name', 'description', 'is_active']
  },
  suppliers: {
    required: true,
    description: 'Supplier management',
    criticalColumns: ['id', 'name', 'contact_person', 'phone', 'email', 'address']
  },
  customers: {
    required: true,
    description: 'Customer management',
    criticalColumns: ['id', 'name', 'phone', 'email', 'address', 'credit_limit']
  },
  products: {
    required: true,
    description: 'Product inventory',
    criticalColumns: ['id', 'name', 'code', 'category_id', 'brand_id', 'supplier_id', 'quantity', 'purchase_price', 'sale_price']
  },
  sales: {
    required: true,
    description: 'Sales transactions',
    criticalColumns: ['id', 'customer_id', 'total_amount', 'payment_status', 'sale_date']
  },
  purchases: {
    required: true,
    description: 'Purchase transactions',
    criticalColumns: ['id', 'supplier_id', 'total_amount', 'payment_status', 'purchase_date']
  },
  sale_items: {
    required: false,
    description: 'Sales line items',
    criticalColumns: ['id', 'sale_id', 'product_id', 'quantity', 'unit_price']
  },
  purchase_items: {
    required: false,
    description: 'Purchase line items',
    criticalColumns: ['id', 'purchase_id', 'product_id', 'quantity', 'unit_price']
  },
  stock_movements: {
    required: false,
    description: 'Inventory movement tracking',
    criticalColumns: ['id', 'product_id', 'movement_type', 'quantity', 'movement_date']
  },
  settings: {
    required: false,
    description: 'System settings',
    criticalColumns: ['id', 'key', 'value']
  },
  audit_logs: {
    required: false,
    description: 'System audit trail',
    criticalColumns: ['id', 'table_name', 'action', 'record_id', 'created_at']
  }
}

// Database setup and validation functions
export const databaseSetup = {
  
  // Validate database structure
  validateSchema: async () => {
    console.log('🔍 Validating database schema...')
    
    const results = {
      timestamp: new Date().toISOString(),
      valid: false,
      tables: {},
      summary: {
        total: 0,
        accessible: 0,
        required: 0,
        requiredAccessible: 0
      },
      errors: [],
      warnings: []
    }

    try {
      const tableNames = Object.keys(EXPECTED_TABLES)
      results.summary.total = tableNames.length
      results.summary.required = Object.values(EXPECTED_TABLES).filter(t => t.required).length

      // Test each table
      for (const tableName of tableNames) {
        const tableConfig = EXPECTED_TABLES[tableName]
        console.log(`  Checking table: ${tableName}`)
        
        const accessTest = await supabaseQuery.checkTableAccess(tableName)
        const tableInfo = accessTest.accessible ? await supabaseQuery.getTableInfo(tableName) : null
        
        results.tables[tableName] = {
          required: tableConfig.required,
          accessible: accessTest.accessible,
          error: accessTest.error,
          columns: tableInfo?.columns || [],
          description: tableConfig.description
        }

        if (accessTest.accessible) {
          results.summary.accessible++
          if (tableConfig.required) {
            results.summary.requiredAccessible++
          }
          console.log(`    ✅ ${tableName} - accessible`)
        } else {
          const message = `Table ${tableName} not accessible: ${accessTest.error}`
          if (tableConfig.required) {
            results.errors.push(message)
            console.log(`    ❌ ${tableName} - ${accessTest.error}`)
          } else {
            results.warnings.push(message)
            console.log(`    ⚠️ ${tableName} - ${accessTest.error}`)
          }
        }
      }

      // Determine if schema is valid
      const requiredTablesAccessible = results.summary.requiredAccessible === results.summary.required
      const minimumTablesAccessible = results.summary.accessible >= 5 // At least 5 tables should be accessible
      
      results.valid = requiredTablesAccessible && minimumTablesAccessible

      console.log(`📊 Schema validation complete:`)
      console.log(`   Total tables: ${results.summary.total}`)
      console.log(`   Accessible: ${results.summary.accessible}`)
      console.log(`   Required accessible: ${results.summary.requiredAccessible}/${results.summary.required}`)
      console.log(`   Status: ${results.valid ? '✅ VALID' : '❌ INVALID'}`)

    } catch (error) {
      results.errors.push(`Schema validation failed: ${error.message}`)
      console.error('❌ Schema validation error:', error)
    }

    return results
  },

  // Initialize database with sample data if needed
  initializeDatabase: async () => {
    console.log('🚀 Initializing database...')
    
    const results = {
      timestamp: new Date().toISOString(),
      success: false,
      actions: [],
      errors: []
    }

    try {
      // First validate schema
      const schemaValidation = await databaseSetup.validateSchema()
      
      if (!schemaValidation.valid) {
        results.errors.push('Database schema validation failed')
        return results
      }

      // Check if we have basic data
      const categoriesCheck = await supabaseQuery.getAll('categories')
      if (categoriesCheck.error) {
        results.errors.push(`Cannot access categories: ${categoriesCheck.error.message}`)
        return results
      }

      // If no categories exist, create some basic ones
      if (!categoriesCheck.data || categoriesCheck.data.length === 0) {
        console.log('  Creating default categories...')
        
        const defaultCategories = [
          { name: 'Fertilizers', description: 'Chemical and organic fertilizers', is_active: true, sort_order: 1 },
          { name: 'Seeds', description: 'Agricultural seeds and saplings', is_active: true, sort_order: 2 },
          { name: 'Pesticides', description: 'Pest control products', is_active: true, sort_order: 3 },
          { name: 'Tools', description: 'Agricultural tools and equipment', is_active: true, sort_order: 4 },
          { name: 'Irrigation', description: 'Irrigation supplies and equipment', is_active: true, sort_order: 5 }
        ]

        for (const category of defaultCategories) {
          const insertResult = await supabaseQuery.insert('categories', category)
          if (insertResult.error) {
            results.errors.push(`Failed to create category ${category.name}: ${insertResult.error.message}`)
          } else {
            results.actions.push(`Created category: ${category.name}`)
          }
        }
      }

      // Check brands
      const brandsCheck = await supabaseQuery.getAll('brands')
      if (brandsCheck.data && brandsCheck.data.length === 0) {
        console.log('  Creating default brands...')
        
        const defaultBrands = [
          { name: 'KrishiSethu', description: 'KrishiSethu brand products', is_active: true },
          { name: 'Generic', description: 'Generic brand products', is_active: true },
          { name: 'Premium', description: 'Premium quality products', is_active: true }
        ]

        for (const brand of defaultBrands) {
          const insertResult = await supabaseQuery.insert('brands', brand)
          if (insertResult.error) {
            results.errors.push(`Failed to create brand ${brand.name}: ${insertResult.error.message}`)
          } else {
            results.actions.push(`Created brand: ${brand.name}`)
          }
        }
      }

      results.success = results.errors.length === 0
      console.log(`✅ Database initialization ${results.success ? 'completed' : 'completed with errors'}`)

    } catch (error) {
      results.errors.push(`Database initialization failed: ${error.message}`)
      console.error('❌ Database initialization error:', error)
    }

    return results
  },

  // Run comprehensive database health check
  healthCheck: async () => {
    console.log('🏥 Running database health check...')
    
    try {
      const health = await supabaseDiagnostics.healthCheck()
      
      console.log(`📊 Database Health Report:`)
      console.log(`   Overall Status: ${health.overall.toUpperCase()}`)
      console.log(`   Connection: ${health.connection?.connected ? '✅ Connected' : '❌ Failed'}`)
      console.log(`   Tables: ${health.performance?.accessibleTables}/${health.performance?.totalTables} accessible`)
      console.log(`   Avg Response Time: ${health.performance?.averageResponseTime?.toFixed(2)}ms`)
      
      if (health.errors.length > 0) {
        console.log(`   Errors:`)
        health.errors.forEach(error => console.log(`     ❌ ${error}`))
      }

      return health
    } catch (error) {
      console.error('❌ Health check failed:', error)
      return {
        timestamp: new Date().toISOString(),
        overall: 'failed',
        errors: [error.message]
      }
    }
  },

  // Quick connectivity test
  quickTest: async () => {
    console.log('⚡ Running quick database test...')
    
    try {
      const result = await supabaseDiagnostics.quickTest()
      
      console.log(`⚡ Quick Test Result:`)
      console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`)
      console.log(`   Response Time: ${result.responseTime}ms`)
      
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }

      return result
    } catch (error) {
      console.error('❌ Quick test failed:', error)
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
}

export default databaseSetup
