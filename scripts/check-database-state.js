/**
 * Database State Checker
 * 
 * This script checks the current state of categories and brands in the database
 * to determine if we have real UUIDs or need to populate the tables.
 */

import { supabase } from '../src/lib/supabase.js';

async function checkDatabaseState() {
  console.log('🔍 Checking database state...\n');
  
  try {
    // Check categories
    console.log('📋 CATEGORIES TABLE:');
    console.log('==================');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError.message);
    } else if (!categories || categories.length === 0) {
      console.log('📦 Categories table is EMPTY');
      console.log('💡 Need to populate with real categories');
    } else {
      console.log(`✅ Found ${categories.length} categories:`);
      categories.forEach((cat, index) => {
        console.log(`${index + 1}. "${cat.name}" (ID: ${cat.id})`);
        console.log(`   - Description: ${cat.description || 'N/A'}`);
        console.log(`   - Active: ${cat.is_active}`);
        console.log(`   - Sort Order: ${cat.sort_order}`);
        console.log('');
      });
    }
    
    console.log('\n🏷️ BRANDS TABLE:');
    console.log('================');
    
    // Check brands
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true });
    
    if (brandsError) {
      console.error('❌ Error fetching brands:', brandsError.message);
    } else if (!brands || brands.length === 0) {
      console.log('📦 Brands table is EMPTY');
      console.log('💡 Need to add some sample brands');
    } else {
      console.log(`✅ Found ${brands.length} brands:`);
      brands.forEach((brand, index) => {
        console.log(`${index + 1}. "${brand.name}" (ID: ${brand.id})`);
        console.log(`   - Description: ${brand.description || 'N/A'}`);
        console.log(`   - Active: ${brand.is_active}`);
        console.log('');
      });
    }
    
    console.log('\n📊 SUMMARY:');
    console.log('===========');
    console.log(`Categories: ${categories?.length || 0} found`);
    console.log(`Brands: ${brands?.length || 0} found`);
    
    if ((!categories || categories.length === 0) || (!brands || brands.length === 0)) {
      console.log('\n⚠️  ACTION REQUIRED:');
      if (!categories || categories.length === 0) {
        console.log('- Need to populate categories table with standard fertilizer categories');
      }
      if (!brands || brands.length === 0) {
        console.log('- Need to add some sample brands to the brands table');
      }
      console.log('\nThis will allow the AddProduct form to use real UUIDs instead of fake ones.');
    } else {
      console.log('\n✅ DATABASE READY: Both tables have data with real UUIDs');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
  
  process.exit(0);
}

checkDatabaseState();
