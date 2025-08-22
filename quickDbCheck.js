// Quick Database Analysis Script
// Run with: node quickDbCheck.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://srhfccodjurgnuvuqynp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaGZjY29kanVyZ251dnVxeW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDU0NzksImV4cCI6MjA3MDkyMTQ3OX0.emNVb99D7c6K8CKYqkdDTzKr3Ly6mErKEFMEGbIDN8A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickDatabaseCheck() {
  console.log('🔍 Quick Database Analysis Starting...');
  console.log('='.repeat(50));

  // Test connection and get profiles data
  try {
    console.log('📡 Testing connection to Supabase...');
    console.log('URL:', supabaseUrl);
    
    // Test different table names
    const tableNames = ['profiles', 'users', 'user_profiles', 'accounts'];
    
    for (const tableName of tableNames) {
      console.log(`\n📋 Testing table: ${tableName}`);
      
      try {
        // Get sample data
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(3);

        if (error) {
          console.log(`❌ Error: ${error.message}`);
          continue;
        }

        console.log(`✅ Success! Found ${count || data?.length || 0} records`);
        
        if (data && data.length > 0) {
          console.log(`📊 Columns (${Object.keys(data[0]).length}):`, Object.keys(data[0]).join(', '));
          console.log(`🔍 Sample record:`, JSON.stringify(data[0], null, 2));
          
          // Check for specific fields we need
          const columns = Object.keys(data[0]);
          const nameFields = columns.filter(col => 
            ['name', 'full_name', 'user_name', 'display_name'].includes(col.toLowerCase())
          );
          const trialFields = columns.filter(col => 
            ['trial_end_date', 'trial_end', 'trial_expires_at', 'trial_expiry'].includes(col.toLowerCase())
          );
          
          console.log(`📝 Name fields found:`, nameFields.join(', ') || 'NONE');
          console.log(`📅 Trial fields found:`, trialFields.join(', ') || 'NONE');
          
          // Look for trial users
          const trialUsers = data.filter(user => {
            const role = user.role || user.account_type || '';
            return role.toLowerCase().includes('trial') || !user.is_paid;
          });
          
          if (trialUsers.length > 0) {
            console.log(`🎯 Found ${trialUsers.length} potential trial users`);
            trialUsers.forEach((user, i) => {
              const name = user.name || user.full_name || user.email || 'Unknown';
              console.log(`   ${i+1}. ${name} (${user.role || user.account_type || 'no role'})`);
            });
          }
          
          break; // Found working table, stop here
        } else {
          console.log(`⚠️  Table exists but is empty`);
        }
        
      } catch (tableError) {
        console.log(`❌ Exception: ${tableError.message}`);
      }
    }

    // Test other important tables
    console.log(`\n📋 Testing other tables...`);
    const otherTables = ['customers', 'sales', 'products', 'categories'];
    
    for (const tableName of otherTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          console.log(`✅ ${tableName}: ${count || 0} records`);
        } else {
          console.log(`❌ ${tableName}: ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🔍 Quick Analysis Complete');
}

// Run the analysis
quickDatabaseCheck();