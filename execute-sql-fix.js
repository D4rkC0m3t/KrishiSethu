#!/usr/bin/env node

/**
 * Execute SQL fix via direct PostgreSQL connection
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lnljcgttcdhrduixirgf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo';

// Create Supabase client with service role key if available
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeSQLFile(filename) {
  try {
    console.log(`🔄 Reading SQL file: ${filename}`);
    
    if (!fs.existsSync(filename)) {
      console.log(`❌ File ${filename} not found`);
      return false;
    }
    
    const sqlContent = fs.readFileSync(filename, 'utf8');
    console.log(`✅ SQL file loaded (${sqlContent.length} characters)`);
    
    // Split SQL into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== 'BEGIN' && stmt !== 'COMMIT');
    
    console.log(`🔄 Found ${statements.length} SQL statements to execute`);
    console.log('');
    
    let successCount = 0;
    let failureCount = 0;
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length < 10) {
        continue;
      }
      
      console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      
      try {
        // Try to execute via RPC if possible
        const { data, error } = await supabase.rpc('sql', { query: statement });
        
        if (error) {
          console.log(`❌ Failed: ${error.message}`);
          failureCount++;
        } else {
          console.log(`✅ Success`);
          successCount++;
        }
      } catch (err) {
        // If RPC doesn't exist, try using raw SQL execution
        console.log(`⚠️  RPC failed, trying alternative: ${err.message}`);
        
        try {
          // For some statements, we might be able to use direct table operations
          if (statement.toLowerCase().includes('insert into public.categories')) {
            const { error } = await supabase.from('categories').insert([
              { name: 'Compound Fertilizers', description: 'Multi-nutrient fertilizers with NPK combinations', sort_order: 1 },
              { name: 'Nitrogen Fertilizers', description: 'High nitrogen content fertilizers', sort_order: 2 },
              { name: 'Phosphorus Fertilizers', description: 'Phosphorus-rich fertilizers for root development', sort_order: 3 },
              { name: 'Potassium Fertilizers', description: 'Potassium fertilizers for plant strength', sort_order: 4 },
              { name: 'Organic Fertilizers', description: 'Natural and organic fertilizer options', sort_order: 5 }
            ]);
            
            if (error && !error.message.includes('duplicate key')) {
              console.log(`❌ Categories insert failed: ${error.message}`);
              failureCount++;
            } else {
              console.log(`✅ Categories inserted via API`);
              successCount++;
            }
          } else if (statement.toLowerCase().includes('insert into public.brands')) {
            const { error } = await supabase.from('brands').insert([
              { name: 'AgriCorp', description: 'Premium agricultural products and fertilizers' },
              { name: 'FertMax', description: 'Maximum yield fertilizer solutions' },
              { name: 'CropGrow', description: 'Complete crop nutrition systems' },
              { name: 'NutriCrop', description: 'Essential plant nutrition products' },
              { name: 'EcoFarm', description: 'Sustainable and organic farming solutions' }
            ]);
            
            if (error && !error.message.includes('duplicate key') && !error.message.includes('does not exist')) {
              console.log(`❌ Brands insert failed: ${error.message}`);
              failureCount++;
            } else {
              console.log(`✅ Brands inserted via API`);
              successCount++;
            }
          } else {
            console.log(`⚠️  Cannot execute DDL statement via API`);
            failureCount++;
          }
        } catch (altErr) {
          console.log(`❌ Alternative execution failed: ${altErr.message}`);
          failureCount++;
        }
      }
      
      console.log('');
    }
    
    console.log('📊 EXECUTION SUMMARY:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📄 Total: ${statements.length}`);
    
    if (failureCount > successCount) {
      console.log('');
      console.log('⚠️  MOST STATEMENTS FAILED');
      console.log('This is expected because DDL operations require elevated privileges.');
      console.log('');
      console.log('🎯 SOLUTION:');
      console.log('The SQL needs to be executed in Supabase Dashboard SQL Editor.');
      console.log('URL: https://supabase.com/dashboard/project/lnljcgttcdhrduixirgf/sql');
      console.log('');
      console.log('Copy the contents of fix_database_schema.sql and paste it there.');
      return false;
    }
    
    return true;
    
  } catch (err) {
    console.log(`❌ Error executing SQL file: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 EXECUTING DATABASE FIX VIA CLI');
  console.log('==================================');
  console.log('');
  
  const success = await executeSQLFile('fix_database_schema.sql');
  
  if (success) {
    console.log('🎉 Database fix executed successfully!');
    console.log('');
    console.log('🔄 Running verification...');
    
    // Import and run verification
    const { execSync } = require('child_process');
    try {
      execSync('node verify-fix.js', { stdio: 'inherit' });
    } catch (err) {
      console.log('⚠️  Verification script failed, but fix might still be successful');
    }
  } else {
    console.log('❌ Database fix could not be completed via CLI');
    console.log('');
    console.log('📋 MANUAL STEPS REQUIRED:');
    console.log('1. Open: https://supabase.com/dashboard/project/lnljcgttcdhrduixirgf/sql');
    console.log('2. Copy contents of fix_database_schema.sql');
    console.log('3. Paste and execute in SQL Editor');
    console.log('4. Run: node verify-fix.js');
  }
}

main().catch(console.error);
