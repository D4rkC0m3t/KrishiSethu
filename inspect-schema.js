#!/usr/bin/env node

/**
 * Advanced Database Schema Inspector
 * Analyzes actual table structures and constraints
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lnljcgttcdhrduixirgf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function inspectTableSchema(tableName) {
  console.log(`\n🔍 INSPECTING: ${tableName.toUpperCase()}`);
  console.log('='.repeat(50));
  
  try {
    // Method 1: Try to get a sample record to see column structure
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log(`❌ Cannot access ${tableName}:`, sampleError.message);
      return null;
    }
    
    console.log(`✅ Table ${tableName} is accessible`);
    
    // Method 2: Get column information by trying to select with invalid column
    try {
      await supabase
        .from(tableName)
        .select('nonexistent_column_xyz')
        .limit(1);
    } catch (columnError) {
      const errorMessage = columnError.message || '';
      if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
        console.log('📋 Detected column error - table exists but column invalid');
      }
    }
    
    // Method 3: Check if we have sample data
    if (sampleData && sampleData.length > 0) {
      console.log(`📄 Sample record found:`);
      const sample = sampleData[0];
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = typeof value;
        const truncatedValue = value !== null && value !== undefined ? 
          String(value).substring(0, 50) : 'null';
        console.log(`   ${key}: ${type} = "${truncatedValue}"`);
      });
    } else {
      console.log(`📭 Table ${tableName} is empty`);
      
      // Try to insert a test record to understand the structure
      console.log(`🧪 Attempting test insert to understand schema...`);
      
      const testData = getTestDataForTable(tableName);
      if (testData) {
        try {
          const { error: insertError } = await supabase
            .from(tableName)
            .insert(testData);
          
          if (insertError) {
            console.log(`📋 Insert error reveals schema info:`, insertError.message);
            
            // Parse error message for column information
            const message = insertError.message;
            if (message.includes('column') && message.includes('does not exist')) {
              const columnMatch = message.match(/column "([^"]+)" does not exist/);
              if (columnMatch) {
                console.log(`❌ Column "${columnMatch[1]}" does not exist in ${tableName}`);
              }
            }
            if (message.includes('null value in column')) {
              const nullColumnMatch = message.match(/null value in column "([^"]+)"/);
              if (nullColumnMatch) {
                console.log(`📋 Required column: "${nullColumnMatch[1]}" (NOT NULL)`);
              }
            }
            if (message.includes('violates check constraint')) {
              console.log(`📋 Has check constraints (enum values or other restrictions)`);
            }
          } else {
            console.log(`✅ Test insert successful - will clean up`);
            // Clean up the test record
            await supabase.from(tableName).delete().eq('name', 'TEST_RECORD');
          }
        } catch (insertTestError) {
          console.log(`📋 Test insert error:`, insertTestError.message);
        }
      }
    }
    
    // Method 4: Get record count
    try {
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`📊 Total records: ${count || 0}`);
      }
    } catch (countError) {
      console.log(`📊 Could not get count:`, countError.message);
    }
    
    return {
      accessible: true,
      hasData: sampleData && sampleData.length > 0,
      sampleRecord: sampleData?.[0] || null,
      columns: sampleData?.[0] ? Object.keys(sampleData[0]) : []
    };
    
  } catch (error) {
    console.log(`❌ Error inspecting ${tableName}:`, error.message);
    return null;
  }
}

function getTestDataForTable(tableName) {
  const testData = {
    products: {
      name: 'TEST_RECORD',
      category: 'Test',
      sku: 'TEST-001',
      quantity: 1,
      unit_price: 100,
      sale_price: 120
    },
    categories: {
      name: 'TEST_RECORD',
      description: 'Test category'
    },
    brands: {
      name: 'TEST_RECORD',
      description: 'Test brand'
    },
    suppliers: {
      name: 'TEST_RECORD',
      phone: '1234567890'
    },
    customers: {
      name: 'TEST_RECORD',
      phone: '1234567890'
    },
    users: {
      email: 'test@example.com',
      full_name: 'TEST_RECORD'
    }
  };
  
  return testData[tableName] || null;
}

async function analyzeProductsTableSpecifically() {
  console.log(`\n🎯 DETAILED PRODUCTS TABLE ANALYSIS`);
  console.log('='.repeat(50));
  
  // Test specific fields that the Inventory component expects
  const expectedFields = [
    'id', 'name', 'description', 'category', 'brand', 'type',
    'sku', 'barcode', 'quantity', 'unit', 'unit_price', 'sale_price',
    'purchase_price', 'reorder_level', 'min_stock_level', 'max_stock_level',
    'batch_no', 'expiry_date', 'manufacturing_date',
    'supplier', 'supplier_id', 'category_id', 'brand_id',
    'status', 'gst_rate', 'image_urls', 'created_at', 'updated_at'
  ];
  
  console.log('🔍 Testing expected fields from Inventory.jsx...');
  
  for (const field of expectedFields) {
    try {
      const { error } = await supabase
        .from('products')
        .select(field)
        .limit(1);
      
      if (error) {
        if (error.message.includes(`column "${field}" does not exist`)) {
          console.log(`❌ Missing: ${field}`);
        } else {
          console.log(`⚠️  ${field}: ${error.message}`);
        }
      } else {
        console.log(`✅ Found: ${field}`);
      }
    } catch (err) {
      console.log(`❌ Error testing ${field}:`, err.message);
    }
  }
}

async function testProductTypeEnum() {
  console.log(`\n🔬 TESTING PRODUCT TYPE ENUM`);
  console.log('='.repeat(50));
  
  const enumValues = ['Chemical', 'Organic', 'Bio', 'NPK', 'Seeds', 'Pesticide', 'Tools'];
  
  console.log('Testing if product type enum exists...');
  
  for (const enumValue of enumValues) {
    try {
      const testProduct = {
        name: `TEST_${enumValue}`,
        category: 'Test',
        sku: `TEST-${enumValue}-001`,
        type: enumValue,
        quantity: 1
      };
      
      const { error } = await supabase
        .from('products')
        .insert(testProduct);
      
      if (error) {
        if (error.message.includes('invalid input value for enum')) {
          console.log(`❌ Invalid enum value: ${enumValue}`);
        } else if (error.message.includes('column "type" does not exist')) {
          console.log(`❌ Type column does not exist`);
          break;
        } else {
          console.log(`⚠️  ${enumValue}: ${error.message}`);
        }
      } else {
        console.log(`✅ Valid enum: ${enumValue}`);
        // Clean up
        await supabase.from('products').delete().eq('name', `TEST_${enumValue}`);
      }
    } catch (err) {
      console.log(`❌ Error testing ${enumValue}:`, err.message);
    }
  }
}

async function main() {
  console.log('🔬 ADVANCED DATABASE SCHEMA INSPECTION');
  console.log('=====================================');
  console.log('🔒 Testing database structure through strategic queries');
  console.log('');
  
  const tables = ['users', 'products', 'categories', 'brands', 'suppliers', 'customers'];
  const results = {};
  
  // Inspect each table
  for (const table of tables) {
    results[table] = await inspectTableSchema(table);
  }
  
  // Special detailed analysis for products table
  if (results.products && results.products.accessible) {
    await analyzeProductsTableSpecifically();
    await testProductTypeEnum();
  }
  
  // Summary
  console.log(`\n📊 INSPECTION SUMMARY`);
  console.log('='.repeat(50));
  
  Object.keys(results).forEach(table => {
    const result = results[table];
    if (result) {
      const status = result.accessible ? '✅' : '❌';
      const data = result.hasData ? `(has data)` : `(empty)`;
      const columns = result.columns.length > 0 ? `[${result.columns.length} cols]` : '';
      console.log(`${status} ${table}: accessible ${data} ${columns}`);
      
      if (result.columns.length > 0) {
        console.log(`    Columns: ${result.columns.join(', ')}`);
      }
    } else {
      console.log(`❌ ${table}: not accessible`);
    }
  });
  
  console.log('');
  console.log('🎯 NEXT STEPS RECOMMENDATION:');
  if (results.products && results.products.accessible) {
    if (results.products.hasData) {
      console.log('✅ Products table has data - inventory should work');
    } else {
      console.log('📦 Products table is empty - need to add products');
    }
  } else {
    console.log('❌ Products table issues - need to fix schema');
  }
}

main().catch((err) => {
  console.error('💥 Inspection failed:', err.message);
  process.exit(1);
});
