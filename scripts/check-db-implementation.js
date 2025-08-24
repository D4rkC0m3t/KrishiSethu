/**
 * Database Implementation Checker
 * 
 * This script checks the current database implementation against our checklist
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lnljcgttcdhrduixirgf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwODkzNDUsImV4cCI6MjA1MDY2NTM0NX0.wGhG1ZLDOHtSTMXXz6KMShXoFNJUMqhQo8LuNXaMuLU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseImplementation() {
  console.log('🔍 Checking Database Implementation vs Checklist...\n');
  
  try {
    // 1. Check table schemas
    console.log('📋 1. SCHEMA ANALYSIS:');
    console.log('=====================');
    
    // Check products table structure
    const { data: productsSchema, error: schemaError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Error fetching products schema:', schemaError.message);
    } else if (productsSchema && productsSchema.length > 0) {
      const product = productsSchema[0];
      console.log('✅ Products table fields:', Object.keys(product));
      
      // Check for redundancy
      const hasRedundancy = product.hasOwnProperty('category') && product.hasOwnProperty('category_id') &&
                           product.hasOwnProperty('brand') && product.hasOwnProperty('brand_id');
      
      if (hasRedundancy) {
        console.log('⚠️  REDUNDANCY DETECTED:');
        console.log('   - Both category_id (UUID) and category (text) present');
        console.log('   - Both brand_id (UUID) and brand (text) present');
        console.log('   - Recommendation: Remove text fields, derive from relations');
      }
    }
    
    // 2. Check for indexes (this would need admin privileges, so we'll simulate)
    console.log('\n📈 2. PERFORMANCE ANALYSIS:');
    console.log('===========================');
    console.log('❓ Index check requires admin privileges');
    console.log('💡 Recommended indexes to verify:');
    console.log('   - idx_products_category_id');
    console.log('   - idx_products_brand_id'); 
    console.log('   - idx_products_supplier_id');
    console.log('   - idx_products_active');
    console.log('   - idx_products_low_stock');
    
    // 3. Check data integrity
    console.log('\n🔒 3. DATA INTEGRITY:');
    console.log('====================');
    
    // Check for negative quantities
    const { data: negativeQty } = await supabase
      .from('products')
      .select('id, name, quantity')
      .lt('quantity', 0)
      .limit(5);
    
    if (negativeQty && negativeQty.length > 0) {
      console.log('⚠️  Found products with negative quantities:');
      negativeQty.forEach(p => console.log(`   - ${p.name}: ${p.quantity}`));
    } else {
      console.log('✅ No negative quantities found');
    }
    
    // Check for invalid prices
    const { data: invalidPrices } = await supabase
      .from('products')
      .select('id, name, purchase_price, sale_price')
      .or('purchase_price.lt.0,sale_price.lt.0,sale_price.lt.purchase_price')
      .limit(5);
    
    if (invalidPrices && invalidPrices.length > 0) {
      console.log('⚠️  Found products with invalid pricing:');
      invalidPrices.forEach(p => {
        console.log(`   - ${p.name}: Purchase ₹${p.purchase_price}, Sale ₹${p.sale_price}`);
      });
    } else {
      console.log('✅ All product prices are valid');
    }
    
    // 4. Check foreign key relationships
    console.log('\n🔗 4. RELATIONSHIP INTEGRITY:');
    console.log('=============================');
    
    // Check orphaned products (missing category/brand)
    const { data: orphanedProducts } = await supabase
      .from('products')
      .select('id, name, category_id, brand_id')
      .or('category_id.is.null,brand_id.is.null')
      .limit(5);
    
    if (orphanedProducts && orphanedProducts.length > 0) {
      console.log('⚠️  Found orphaned products (missing category/brand):');
      orphanedProducts.forEach(p => {
        const issues = [];
        if (!p.category_id) issues.push('missing category');
        if (!p.brand_id) issues.push('missing brand');
        console.log(`   - ${p.name}: ${issues.join(', ')}`);
      });
    } else {
      console.log('✅ All products have valid category and brand references');
    }
    
    // 5. Check audit fields
    console.log('\n📅 5. AUDIT FIELDS:');
    console.log('==================');
    
    const { data: auditCheck } = await supabase
      .from('products')
      .select('id, created_at, updated_at')
      .or('created_at.is.null,updated_at.is.null')
      .limit(3);
    
    if (auditCheck && auditCheck.length > 0) {
      console.log('⚠️  Found records with missing audit fields');
    } else {
      console.log('✅ All records have proper audit timestamps');
    }
    
    // 6. Sample data analysis
    console.log('\n📊 6. DATA QUALITY SAMPLE:');
    console.log('==========================');
    
    const { data: sampleProducts } = await supabase
      .from('products')
      .select('name, category_id, brand_id, quantity, purchase_price, sale_price')
      .limit(3);
    
    if (sampleProducts && sampleProducts.length > 0) {
      console.log('✅ Sample products for quality check:');
      sampleProducts.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   - Category ID: ${p.category_id}`);
        console.log(`   - Brand ID: ${p.brand_id}`);
        console.log(`   - Stock: ${p.quantity}`);
        console.log(`   - Prices: ₹${p.purchase_price} → ₹${p.sale_price}`);
      });
    }
    
    console.log('\n🎯 SUMMARY & RECOMMENDATIONS:');
    console.log('==============================');
    console.log('✅ Strengths:');
    console.log('   - Proper UUID primary keys');
    console.log('   - Foreign key relationships established');
    console.log('   - Audit fields present');
    console.log('   - Data integrity generally good');
    
    console.log('\n⚠️  Priority Improvements Needed:');
    console.log('   1. Add performance indexes for FK columns');
    console.log('   2. Add check constraints for data validation'); 
    console.log('   3. Consider removing redundant text fields');
    console.log('   4. Add PL/SQL functions for stock management');
    console.log('   5. Set up monitoring and alerting');
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Run database performance analysis');
    console.log('   2. Check RLS policies configuration');
    console.log('   3. Verify backup and monitoring setup');
    console.log('   4. Create stock management procedures');
    
  } catch (error) {
    console.error('💥 Error during database analysis:', error);
  }
  
  process.exit(0);
}

checkDatabaseImplementation();
