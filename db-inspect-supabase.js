import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = 'https://srhfccodjurgnuvuqynp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaGZjY29kanVyZ251dnVxeW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDU0NzksImV4cCI6MjA3MDkyMTQ3OX0.emNVb99D7c6K8CKYqkdDTzKr3Ly6mErKEFMEGbIDN8A'

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectDatabase() {
  console.log("🔌 Connecting to Supabase database...")
  console.log(`📍 URL: ${supabaseUrl}`)
  console.log("=".repeat(60))

  try {
    // Test connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)

    if (connectionError) {
      console.log("❌ Connection test failed, trying direct table queries...")
    } else {
      console.log("✅ Connection successful!")
    }

    // 1. Get all tables using RPC or direct queries
    console.log("\n📋 FETCHING TABLES...")
    
    // Try to get table information
    const tables = [
      'users', 'products', 'categories', 'suppliers', 'customers', 
      'sales', 'purchases', 'stock_movements', 'brands', 'notifications'
    ]

    const tableInfo = {}
    
    for (const tableName of tables) {
      try {
        console.log(`🔍 Checking table: ${tableName}`)
        
        // Get table structure by querying the first row
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(1)

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
          tableInfo[tableName] = { 
            exists: false, 
            error: error.message,
            count: 0,
            columns: []
          }
        } else {
          const columns = data && data.length > 0 ? Object.keys(data[0]) : []
          console.log(`✅ ${tableName}: ${count} rows, ${columns.length} columns`)
          
          tableInfo[tableName] = {
            exists: true,
            count: count || 0,
            columns: columns,
            sampleData: data
          }
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
        tableInfo[tableName] = { 
          exists: false, 
          error: err.message,
          count: 0,
          columns: []
        }
      }
    }

    // 2. Display results
    console.log("\n" + "=".repeat(60))
    console.log("📊 DATABASE INSPECTION RESULTS")
    console.log("=".repeat(60))

    console.log("\n📋 TABLE SUMMARY:")
    const summary = Object.entries(tableInfo).map(([name, info]) => ({
      table: name,
      exists: info.exists ? '✅' : '❌',
      rows: info.count,
      columns: info.columns.length,
      error: info.error || 'None'
    }))
    console.table(summary)

    // 3. Detailed table information
    console.log("\n📝 DETAILED TABLE INFORMATION:")
    
    Object.entries(tableInfo).forEach(([tableName, info]) => {
      if (info.exists) {
        console.log(`\n🗂️  ${tableName.toUpperCase()}:`)
        console.log(`   📊 Rows: ${info.count}`)
        console.log(`   📝 Columns: ${info.columns.join(', ')}`)
        
        if (info.sampleData && info.sampleData.length > 0) {
          console.log(`   📋 Sample Data:`)
          console.table(info.sampleData)
        }
      }
    })

    // 4. Try to get some specific data samples
    console.log("\n🔍 SPECIFIC DATA SAMPLES:")
    
    // Users
    try {
      const { data: users } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .limit(5)
      
      if (users && users.length > 0) {
        console.log("\n👥 USERS:")
        console.table(users)
      }
    } catch (err) {
      console.log("❌ Could not fetch users:", err.message)
    }

    // Products
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, stock_quantity, category_id')
        .limit(5)
      
      if (products && products.length > 0) {
        console.log("\n📦 PRODUCTS:")
        console.table(products)
      }
    } catch (err) {
      console.log("❌ Could not fetch products:", err.message)
    }

    // Categories
    try {
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .limit(10)
      
      if (categories && categories.length > 0) {
        console.log("\n🏷️  CATEGORIES:")
        console.table(categories)
      }
    } catch (err) {
      console.log("❌ Could not fetch categories:", err.message)
    }

    // Suppliers
    try {
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('*')
        .limit(5)
      
      if (suppliers && suppliers.length > 0) {
        console.log("\n🏭 SUPPLIERS:")
        console.table(suppliers)
      }
    } catch (err) {
      console.log("❌ Could not fetch suppliers:", err.message)
    }

    console.log("\n✅ Database inspection completed!")
    console.log("=".repeat(60))

  } catch (error) {
    console.error("❌ Database Inspection Error:", error.message)
    console.error("Stack:", error.stack)
  }
}

// Run the inspection
inspectDatabase().catch((err) => {
  console.error("❌ Script Error:", err)
  process.exit(1)
})