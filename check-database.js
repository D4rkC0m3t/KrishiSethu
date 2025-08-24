#!/usr/bin/env node

/**
 * Database Health Check and Setup Script
 * This script connects to your Supabase instance and checks/creates necessary tables
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration (matching your project)
const supabaseUrl = 'https://lnljcgttcdhrduixirgf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConnection() {
  console.log('🔄 Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' }).limit(0);
    if (error) {
      console.log('❌ Connection test failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.log('❌ Connection error:', err.message);
    return false;
  }
}

async function checkTable(tableName) {
  console.log(`🔍 Checking table: ${tableName}`);
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Table ${tableName} error:`, error.message);
      return { exists: false, error: error.message, count: 0 };
    }
    
    // Get count
    const { data: countData, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(0);
      
    const count = countData?.length || 0;
    console.log(`✅ Table ${tableName} exists with ${count} records`);
    return { exists: true, error: null, count };
  } catch (err) {
    console.log(`❌ Table ${tableName} check failed:`, err.message);
    return { exists: false, error: err.message, count: 0 };
  }
}

async function createSampleProducts() {
  console.log('🔄 Creating sample products...');
  
  const sampleProducts = [
    {
      name: 'NPK 20-20-20',
      description: 'Balanced NPK fertilizer for all crops',
      category: 'Compound',
      brand: 'AgriCorp',
      sku: 'NPK-202020-001',
      unit_price: 450.00,
      sale_price: 500.00,
      quantity: 100,
      unit: 'kg',
      reorder_level: 20,
      supplier: 'AgriCorp Industries',
      status: 'active'
    },
    {
      name: 'Urea 46%',
      description: 'High nitrogen content urea fertilizer',
      category: 'Nitrogen',
      brand: 'FertMax',
      sku: 'UREA-46-001',
      unit_price: 350.00,
      sale_price: 400.00,
      quantity: 150,
      unit: 'kg',
      reorder_level: 25,
      supplier: 'FertMax Ltd',
      status: 'active'
    },
    {
      name: 'DAP 18-46-0',
      description: 'Di-ammonium phosphate fertilizer',
      category: 'Phosphorus',
      brand: 'CropGrow',
      sku: 'DAP-18460-001',
      unit_price: 520.00,
      sale_price: 580.00,
      quantity: 80,
      unit: 'kg',
      reorder_level: 15,
      supplier: 'CropGrow Solutions',
      status: 'active'
    },
    {
      name: 'Potash MOP',
      description: 'Muriate of Potash for potassium nutrition',
      category: 'Potassium',
      brand: 'NutriCrop',
      sku: 'MOP-001',
      unit_price: 380.00,
      sale_price: 420.00,
      quantity: 60,
      unit: 'kg',
      reorder_level: 20,
      supplier: 'NutriCrop Industries',
      status: 'active'
    },
    {
      name: 'Organic Compost',
      description: 'Premium organic compost fertilizer',
      category: 'Compost',
      brand: 'EcoFarm',
      sku: 'COMP-ORG-001',
      unit_price: 150.00,
      sale_price: 180.00,
      quantity: 200,
      unit: 'kg',
      reorder_level: 30,
      supplier: 'EcoFarm Organics',
      status: 'active'
    }
  ];

  try {
    const { data, error } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select();

    if (error) {
      console.log('❌ Failed to create sample products:', error.message);
      return false;
    }

    console.log(`✅ Successfully created ${data.length} sample products`);
    return true;
  } catch (err) {
    console.log('❌ Error creating sample products:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 KrishiSethu Database Health Check');
  console.log('=====================================');
  
  // Check connection
  const connected = await checkConnection();
  if (!connected) {
    console.log('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  console.log('');
  
  // Check critical tables
  const tables = ['users', 'products', 'categories', 'brands', 'suppliers', 'customers'];
  const results = {};
  
  for (const table of tables) {
    results[table] = await checkTable(table);
  }
  
  console.log('');
  console.log('📊 Database Summary:');
  console.log('==================');
  
  let allGood = true;
  for (const [table, result] of Object.entries(results)) {
    const status = result.exists ? '✅' : '❌';
    const count = result.exists ? `(${result.count} records)` : `(${result.error})`;
    console.log(`${status} ${table}: ${count}`);
    if (!result.exists) allGood = false;
  }
  
  console.log('');
  
  // If products table is empty, create sample data
  if (results.products?.exists && results.products?.count === 0) {
    console.log('📦 Products table is empty, creating sample data...');
    await createSampleProducts();
  }
  
  if (allGood) {
    console.log('🎉 All tables are properly set up!');
    console.log('💡 Your inventory should now load correctly.');
  } else {
    console.log('⚠️  Some tables are missing or have issues.');
    console.log('💡 You may need to run the setup SQL scripts in Supabase dashboard.');
  }
  
  console.log('');
  console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard/project/lnljcgttcdhrduixirgf');
  console.log('🔧 SQL Editor: https://supabase.com/dashboard/project/lnljcgttcdhrduixirgf/sql');
}

main().catch(console.error);
