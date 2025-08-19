#!/usr/bin/env node

/**
 * Inventory Loading Diagnostic Script
 * Run this to identify and fix inventory loading issues
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration (update these with your actual values)
const supabaseUrl = 'https://srhfccodjurgnuvuqynp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaGZjY29kanVyZ251dnVxeW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDU0NzksImV4cCI6MjA3MDkyMTQ3OX0.emNVb99D7c6K8CKYqkdDTzKr3Ly6mErKEFMEGbIDN8A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseInventoryIssue() {
  console.log('🔍 INVENTORY LOADING DIAGNOSTIC TOOL');
  console.log('=====================================\n');

  let issuesFound = [];
  let solutionsProvided = [];

  try {
    // Test 1: Basic connection
    console.log('1. Testing Supabase connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('categories')
      .select('count(*)', { count: 'exact' })
      .limit(1);

    if (healthError) {
      console.log('❌ Connection failed:', healthError.message);
      issuesFound.push('Supabase connection failed');
      solutionsProvided.push('Check your internet connection and Supabase credentials');
      return;
    } else {
      console.log('✅ Supabase connection successful\n');
    }

    // Test 2: Authentication status
    console.log('2. Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Authentication error:', authError.message);
      issuesFound.push('Authentication failed');
      solutionsProvided.push('User needs to log in to the application');
    } else if (!user) {
      console.log('⚠️ No authenticated user');
      issuesFound.push('No authenticated user');
      solutionsProvided.push('User needs to log in to access inventory');
    } else {
      console.log('✅ User authenticated:', user.email);
    }
    console.log('');

    // Test 3: Products table access
    console.log('3. Testing products table access...');
    const { data: productsCount, error: productsError } = await supabase
      .from('products')
      .select('count(*)', { count: 'exact' });

    if (productsError) {
      console.log('❌ Products table access failed:', productsError.message);
      issuesFound.push('Cannot access products table');
      
      if (productsError.message.includes('RLS') || productsError.message.includes('policy')) {
        solutionsProvided.push('Run: ALTER TABLE public.products DISABLE ROW LEVEL SECURITY; (or fix RLS policies)');
      } else {
        solutionsProvided.push('Check database permissions and table existence');
      }
    } else {
      const count = productsCount?.[0]?.count || 0;
      console.log('✅ Products table accessible');
      console.log(`📊 Total products: ${count}`);
      
      if (count === 0) {
        issuesFound.push('Products table is empty');
        solutionsProvided.push('Add some products to the database using the "Add Product" feature');
      }
    }
    console.log('');

    // Test 4: Products with joins (the actual query used by frontend)
    console.log('4. Testing products query with joins...');
    const { data: productsWithJoins, error: joinError } = await supabase
      .from('products')
      .select(`
        *,
        brands(id, name),
        categories(id, name)
      `)
      .limit(5);

    if (joinError) {
      console.log('❌ Products with joins failed:', joinError.message);
      issuesFound.push('Products query with joins failed');
      solutionsProvided.push('Check if brands and categories tables exist and have proper foreign keys');
    } else {
      console.log('✅ Products with joins successful');
      console.log(`📦 Sample products fetched: ${productsWithJoins?.length || 0}`);
      
      if (productsWithJoins && productsWithJoins.length > 0) {
        const sample = productsWithJoins[0];
        console.log('📋 Sample product structure:', {
          id: sample.id,
          name: sample.name,
          quantity: sample.quantity,
          brand: sample.brands?.name || 'No brand',
          category: sample.categories?.name || 'No category'
        });
      }
    }
    console.log('');

    // Test 5: Check for common data issues
    console.log('5. Checking for data quality issues...');
    
    if (productsWithJoins && productsWithJoins.length > 0) {
      const nullQuantities = productsWithJoins.filter(p => p.quantity === null || p.quantity === undefined);
      const missingNames = productsWithJoins.filter(p => !p.name || p.name.trim() === '');
      const missingBrands = productsWithJoins.filter(p => !p.brands);
      const missingCategories = productsWithJoins.filter(p => !p.categories);

      if (nullQuantities.length > 0) {
        console.log(`⚠️ Found ${nullQuantities.length} products with NULL quantities`);
        issuesFound.push('Products with NULL quantities');
        solutionsProvided.push('Run: UPDATE products SET quantity = 0 WHERE quantity IS NULL;');
      }

      if (missingNames.length > 0) {
        console.log(`⚠️ Found ${missingNames.length} products with missing names`);
        issuesFound.push('Products with missing names');
        solutionsProvided.push('Update products to have proper names');
      }

      if (missingBrands.length > 0) {
        console.log(`⚠️ Found ${missingBrands.length} products with missing brand references`);
        issuesFound.push('Products with missing brand references');
        solutionsProvided.push('Ensure all products have valid brand_id references');
      }

      if (missingCategories.length > 0) {
        console.log(`⚠️ Found ${missingCategories.length} products with missing category references`);
        issuesFound.push('Products with missing category references');
        solutionsProvided.push('Ensure all products have valid category_id references');
      }

      if (nullQuantities.length === 0 && missingNames.length === 0) {
        console.log('✅ Data quality looks good');
      }
    }
    console.log('');

    // Test 6: Check brands and categories tables
    console.log('6. Checking supporting tables...');
    
    const { data: brandsCount, error: brandsError } = await supabase
      .from('brands')
      .select('count(*)', { count: 'exact' });

    const { data: categoriesCount, error: categoriesError } = await supabase
      .from('categories')
      .select('count(*)', { count: 'exact' });

    if (brandsError) {
      console.log('❌ Brands table error:', brandsError.message);
      issuesFound.push('Cannot access brands table');
      solutionsProvided.push('Check brands table existence and permissions');
    } else {
      console.log(`✅ Brands table: ${brandsCount?.[0]?.count || 0} records`);
    }

    if (categoriesError) {
      console.log('❌ Categories table error:', categoriesError.message);
      issuesFound.push('Cannot access categories table');
      solutionsProvided.push('Check categories table existence and permissions');
    } else {
      console.log(`✅ Categories table: ${categoriesCount?.[0]?.count || 0} records`);
    }

  } catch (error) {
    console.log('💥 Unexpected error:', error.message);
    issuesFound.push('Unexpected error occurred');
    solutionsProvided.push('Check console logs for detailed error information');
  }

  // Summary
  console.log('\n🏁 DIAGNOSTIC SUMMARY');
  console.log('====================');
  
  if (issuesFound.length === 0) {
    console.log('✅ No issues found! Inventory should be loading properly.');
    console.log('If you\'re still experiencing issues, try refreshing the page or clearing browser cache.');
  } else {
    console.log(`❌ Found ${issuesFound.length} issue(s):\n`);
    
    issuesFound.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
      console.log(`   Solution: ${solutionsProvided[index]}\n`);
    });

    console.log('🔧 QUICK FIX COMMANDS:');
    console.log('Run these SQL commands in your Supabase SQL editor:\n');
    
    if (issuesFound.some(issue => issue.includes('RLS') || issue.includes('access'))) {
      console.log('-- Disable RLS temporarily for testing:');
      console.log('ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;\n');
    }
    
    if (issuesFound.some(issue => issue.includes('NULL quantities'))) {
      console.log('-- Fix NULL quantities:');
      console.log('UPDATE public.products SET quantity = 0 WHERE quantity IS NULL;\n');
    }
    
    if (issuesFound.some(issue => issue.includes('empty'))) {
      console.log('-- Add sample data:');
      console.log('INSERT INTO products (name, type, quantity, sale_price, is_active) VALUES');
      console.log("('Sample Product', 'Chemical', 100, 500.00, true);\n");
    }
  }
}

// Run the diagnostic
diagnoseInventoryIssue().catch(console.error);