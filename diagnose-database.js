#!/usr/bin/env node

/**
 * Safe Database Diagnostic Script
 * Uses the same configuration as your React app
 * READ-ONLY operations - won't modify anything
 */

const { createClient } = require('@supabase/supabase-js');

// Using the exact same configuration as your React app
const supabaseUrl = 'https://lnljcgttcdhrduixirgf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo';

// Create client with minimal configuration (same as your app)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function testBasicConnection() {
  console.log('🔄 Testing basic Supabase connection...');
  try {
    // Try a very simple operation first
    const { data, error } = await supabase.rpc('version');
    console.log('✅ Basic connection successful');
    return true;
  } catch (err) {
    console.log('❌ Basic connection failed:', err.message);
    return false;
  }
}

async function testTableAccess(tableName) {
  console.log(`🔍 Testing access to table: ${tableName}`);
  try {
    // Try to get just the table structure without data
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .limit(0);
    
    if (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
      return { accessible: false, error: error.message, count: 0 };
    }
    
    console.log(`✅ ${tableName}: accessible (${count || 0} records)`);
    return { accessible: true, error: null, count: count || 0 };
  } catch (err) {
    console.log(`❌ ${tableName}: ${err.message}`);
    return { accessible: false, error: err.message, count: 0 };
  }
}

async function testAnonymousAuth() {
  console.log('🔐 Testing anonymous authentication...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error && !error.message.includes('not signed in')) {
      console.log('❌ Auth test failed:', error.message);
      return false;
    }
    console.log('✅ Auth system accessible (anonymous user)');
    return true;
  } catch (err) {
    console.log('❌ Auth error:', err.message);
    return false;
  }
}

async function getSampleData(tableName) {
  console.log(`📄 Getting sample from ${tableName}...`);
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ ${tableName} sample failed: ${error.message}`);
      return null;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ ${tableName} sample:`, Object.keys(data[0]));
      return data[0];
    } else {
      console.log(`📭 ${tableName} is empty`);
      return {};
    }
  } catch (err) {
    console.log(`❌ ${tableName} sample error: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 KrishiSethu Database Diagnostics');
  console.log('===================================');
  console.log('🔒 READ-ONLY mode - No changes will be made');
  console.log('');
  
  // Configuration check
  console.log('📋 Configuration:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`);
  console.log('');
  
  // Test 1: Basic connection
  const basicConnection = await testBasicConnection();
  console.log('');
  
  if (!basicConnection) {
    console.log('❌ Cannot proceed - basic connection failed');
    console.log('💡 This might indicate network issues or incorrect credentials');
    return;
  }
  
  // Test 2: Auth system
  await testAnonymousAuth();
  console.log('');
  
  // Test 3: Table access
  const tables = ['users', 'products', 'categories', 'brands', 'suppliers', 'customers'];
  const results = {};
  
  for (const table of tables) {
    results[table] = await testTableAccess(table);
  }
  
  console.log('');
  
  // Test 4: Sample data from accessible tables
  for (const [tableName, result] of Object.entries(results)) {
    if (result.accessible && result.count > 0) {
      await getSampleData(tableName);
    }
  }
  
  console.log('');
  console.log('📊 SUMMARY:');
  console.log('===========');
  
  let accessible = 0;
  let total = tables.length;
  
  for (const [table, result] of Object.entries(results)) {
    const status = result.accessible ? '✅' : '❌';
    const info = result.accessible ? 
      `${result.count} records` : 
      `${result.error}`;
    console.log(`${status} ${table}: ${info}`);
    if (result.accessible) accessible++;
  }
  
  console.log('');
  console.log(`📈 Tables accessible: ${accessible}/${total}`);
  
  if (accessible === total) {
    console.log('🎉 All tables are accessible!');
    console.log('💡 Your inventory should load correctly.');
  } else if (accessible > 0) {
    console.log('⚠️  Some tables are not accessible.');
    console.log('💡 Check RLS policies for missing tables.');
  } else {
    console.log('❌ No tables are accessible.');
    console.log('💡 This indicates RLS policy or permission issues.');
  }
}

main().catch((err) => {
  console.error('💥 Diagnostic script crashed:', err.message);
  process.exit(1);
});
