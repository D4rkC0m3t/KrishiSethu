/**
 * FIELD MAPPING VALIDATION AND FIXES
 * 
 * This script validates and fixes field mapping issues between:
 * - Frontend (camelCase) ↔ Database (snake_case)
 * - Identifies missing field mappings
 * - Tests actual database operations
 * - Provides fixes for mapping inconsistencies
 */

const { supabase } = require('./inventory-management/src/lib/supabase.js');

// Expected field mappings from frontend code analysis
const EXPECTED_MAPPINGS = {
  products: {
    // Fields frontend expects to use (camelCase)
    frontend: [
      'id', 'name', 'code', 'type', 'categoryId', 'brandId', 'supplierId',
      'description', 'composition', 'quantity', 'unit', 'minStockLevel',
      'maxStockLevel', 'reorderPoint', 'purchasePrice', 'salePrice', 'mrp',
      'batchNo', 'expiryDate', 'manufacturingDate', 'hsnCode', 'gstRate',
      'barcode', 'location', 'imageUrls', 'attachments', 'isActive', 
      'createdAt', 'updatedAt'
    ],
    // What database actually has (snake_case from our test)
    database: [
      'attachments', 'barcode', 'batch_no', 'brand_id', 'category_id', 
      'code', 'composition', 'created_at', 'description', 'expiry_date',
      'gst_rate', 'hsn_code', 'id', 'image_urls', 'is_active', 'location',
      'manufacturing_date', 'max_stock_level', 'min_stock_level', 'mrp', 
      'name', 'purchase_price', 'quantity', 'reorder_point', 'sale_price',
      'supplier_id', 'type', 'unit', 'updated_at'
    ]
  },
  categories: {
    frontend: ['id', 'name', 'description', 'isActive', 'sortOrder', 'createdAt', 'updatedAt'],
    database: ['id', 'name', 'description', 'is_active', 'sort_order', 'created_at', 'updated_at']
  },
  brands: {
    frontend: ['id', 'name', 'description', 'isActive', 'logoUrl', 'createdAt', 'updatedAt'],
    database: ['id', 'name', 'description', 'is_active', 'logo_url', 'created_at', 'updated_at']
  },
  suppliers: {
    frontend: [
      'id', 'name', 'contactPerson', 'phone', 'email', 'address', 'gstNumber',
      'panNumber', 'paymentTerms', 'creditLimit', 'outstandingAmount', 'isActive',
      'createdAt', 'updatedAt'
    ],
    database: [
      'address', 'contact_person', 'created_at', 'credit_limit', 'email',
      'gst_number', 'id', 'is_active', 'name', 'outstanding_amount',
      'payment_terms', 'phone', 'pan_number', 'updated_at'
    ]
  },
  customers: {
    frontend: [
      'id', 'name', 'phone', 'email', 'address', 'gstNumber', 'panNumber',
      'creditLimit', 'outstandingAmount', 'totalPurchases', 'isActive',
      'createdAt', 'updatedAt'
    ],
    database: [
      'address', 'created_at', 'credit_limit', 'email', 'gst_number',
      'id', 'is_active', 'name', 'outstanding_amount', 'phone', 
      'total_purchases', 'pan_number', 'updated_at'
    ]
  }
};

// Create camelCase to snake_case conversion
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Create snake_case to camelCase conversion
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Validate field mappings
function validateMappings(tableName) {
  const expected = EXPECTED_MAPPINGS[tableName];
  if (!expected) {
    console.log(`⚠️ No expected mappings defined for table: ${tableName}`);
    return { valid: false, issues: [`No mapping definition for ${tableName}`] };
  }

  const issues = [];
  const missingInDb = [];
  const extraInDb = [];
  
  // Check if all frontend fields have database equivalents
  expected.frontend.forEach(frontendField => {
    const dbField = toSnakeCase(frontendField);
    if (!expected.database.includes(dbField) && !expected.database.includes(frontendField)) {
      missingInDb.push(`${frontendField} -> ${dbField}`);
    }
  });
  
  // Check if database has extra fields not expected by frontend
  expected.database.forEach(dbField => {
    const frontendField = toCamelCase(dbField);
    if (!expected.frontend.includes(frontendField) && !expected.frontend.includes(dbField)) {
      extraInDb.push(`${dbField} -> ${frontendField}`);
    }
  });
  
  if (missingInDb.length > 0) {
    issues.push(`Missing in database: ${missingInDb.join(', ')}`);
  }
  
  if (extraInDb.length > 0) {
    issues.push(`Extra in database: ${extraInDb.join(', ')}`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
    missingInDb,
    extraInDb
  };
}

// Test actual database schema
async function testDatabaseSchema() {
  console.log('🔍 Testing actual database schema...\n');
  
  const results = {};
  
  for (const [tableName, expected] of Object.entries(EXPECTED_MAPPINGS)) {
    console.log(`📋 Testing ${tableName} table...`);
    
    try {
      // Get actual columns from database
      const { data, error } = await supabase.from(tableName).select('*').limit(1);
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
        results[tableName] = { error: error.message };
        continue;
      }
      
      const actualColumns = data && data.length > 0 ? Object.keys(data[0]).sort() : [];
      const validation = validateMappings(tableName);
      
      results[tableName] = {
        success: true,
        actualColumns,
        expectedColumns: expected.database.sort(),
        validation,
        hasData: data && data.length > 0
      };
      
      console.log(`   📊 Actual columns: ${actualColumns.length}`);
      console.log(`   📋 Expected columns: ${expected.database.length}`);
      console.log(`   ✅ Has data: ${data && data.length > 0 ? 'Yes' : 'No'}`);
      
      if (!validation.valid) {
        console.log(`   ⚠️ Issues found:`);
        validation.issues.forEach(issue => console.log(`      - ${issue}`));
      }
      
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
      results[tableName] = { error: err.message };
    }
    
    console.log('');
  }
  
  return results;
}

// Generate updated field mapping configuration
function generateFieldMappings(results) {
  console.log('🔧 Generating corrected field mappings...\n');
  
  const mappings = {};
  
  for (const [tableName, result] of Object.entries(results)) {
    if (!result.success || !result.actualColumns) continue;
    
    const toDb = {};
    const fromDb = {};
    
    result.actualColumns.forEach(dbField => {
      if (dbField.includes('_')) {
        const camelField = toCamelCase(dbField);
        toDb[camelField] = dbField;
        fromDb[dbField] = camelField;
      }
    });
    
    mappings[tableName] = { toDb, fromDb };
  }
  
  return mappings;
}

// Test CRUD operations with field mapping
async function testCrudOperations() {
  console.log('🧪 Testing CRUD operations with field mapping...\n');
  
  const results = {};
  
  // Test categories (simplest table)
  try {
    console.log('📝 Testing categories CRUD...');
    
    // CREATE - Insert test category
    const { data: created, error: createError } = await supabase
      .from('categories')
      .insert({
        name: 'Test Category ' + Date.now(),
        description: 'Test description',
        sort_order: 999,
        is_active: true
      })
      .select()
      .single();
    
    if (createError) {
      console.log(`❌ Create failed: ${createError.message}`);
      results.categories = { create: false, error: createError.message };
      return results;
    }
    
    console.log(`   ✅ Created: ${created.name}`);
    
    // READ - Get the created category
    const { data: read, error: readError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', created.id)
      .single();
    
    if (readError) {
      console.log(`❌ Read failed: ${readError.message}`);
    } else {
      console.log(`   ✅ Read: ${read.name}`);
    }
    
    // UPDATE - Modify the category
    const { data: updated, error: updateError } = await supabase
      .from('categories')
      .update({ description: 'Updated description' })
      .eq('id', created.id)
      .select()
      .single();
    
    if (updateError) {
      console.log(`❌ Update failed: ${updateError.message}`);
    } else {
      console.log(`   ✅ Updated: ${updated.description}`);
    }
    
    // DELETE - Remove test category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', created.id);
    
    if (deleteError) {
      console.log(`❌ Delete failed: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Deleted successfully`);
    }
    
    results.categories = {
      create: !createError,
      read: !readError,
      update: !updateError,
      delete: !deleteError,
      success: !createError && !readError && !updateError && !deleteError
    };
    
  } catch (err) {
    console.log(`❌ Categories CRUD test failed: ${err.message}`);
    results.categories = { error: err.message };
  }
  
  return results;
}

// Main validation function
async function validateFieldMappings() {
  console.log('🚀 FIELD MAPPING VALIDATION STARTED\n');
  console.log('=' .repeat(50) + '\n');
  
  try {
    // Test database connectivity first
    const { data: testConnection } = await supabase.from('categories').select('id').limit(1);
    console.log('✅ Database connection successful\n');
    
    // Test schema
    const schemaResults = await testDatabaseSchema();
    
    // Generate corrected mappings
    const correctedMappings = generateFieldMappings(schemaResults);
    
    // Test CRUD operations
    const crudResults = await testCrudOperations();
    
    // Generate summary report
    console.log('📊 VALIDATION SUMMARY');
    console.log('=' .repeat(30) + '\n');
    
    let totalTables = Object.keys(EXPECTED_MAPPINGS).length;
    let successfulTables = 0;
    let issuesFound = 0;
    
    for (const [tableName, result] of Object.entries(schemaResults)) {
      if (result.success) {
        successfulTables++;
        if (result.validation && !result.validation.valid) {
          issuesFound += result.validation.issues.length;
        }
      }
    }
    
    console.log(`📋 Tables tested: ${totalTables}`);
    console.log(`✅ Successful: ${successfulTables}`);
    console.log(`❌ Failed: ${totalTables - successfulTables}`);
    console.log(`⚠️ Issues found: ${issuesFound}\n`);
    
    // Check CRUD results
    if (crudResults.categories && crudResults.categories.success) {
      console.log('✅ CRUD operations working correctly');
    } else {
      console.log('❌ CRUD operations have issues');
    }
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('-' .repeat(20));
    
    // Provide specific recommendations
    for (const [tableName, result] of Object.entries(schemaResults)) {
      if (result.success && result.validation && !result.validation.valid) {
        console.log(`\n${tableName.toUpperCase()}:`);
        result.validation.issues.forEach(issue => {
          console.log(`  - ${issue}`);
        });
      }
    }
    
    console.log('\n📄 CORRECTED FIELD MAPPINGS:');
    console.log('-' .repeat(30));
    console.log(JSON.stringify(correctedMappings, null, 2));
    
    return {
      success: successfulTables === totalTables && issuesFound === 0,
      schemaResults,
      correctedMappings,
      crudResults,
      summary: {
        totalTables,
        successfulTables,
        issuesFound
      }
    };
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the validation if this file is executed directly
if (require.main === module) {
  validateFieldMappings()
    .then(result => {
      console.log('\n🏁 VALIDATION COMPLETED');
      console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation crashed:', error);
      process.exit(1);
    });
}

module.exports = {
  validateFieldMappings,
  testDatabaseSchema,
  testCrudOperations,
  generateFieldMappings,
  EXPECTED_MAPPINGS
};
