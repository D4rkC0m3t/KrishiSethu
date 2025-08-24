// Database Setup Script for KrishiSethu Trial Management System
// Run with: node setup-database.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration - KrishiSethu Project
const supabaseUrl = 'https://lnljcgttcdhrduixirgf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTk1MjQ0MywiZXhwIjoyMDcxNTI4NDQzfQ.SERVICE_ROLE_KEY_PLACEHOLDER';

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🚀 Starting Fresh Database Setup for KrishiSethu...');
  console.log('='.repeat(60));

  try {
    // Test connection first
    console.log('📡 Testing database connection...');
    const { data: connectionTest, error: connError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (connError && !connError.message.includes('does not exist')) {
      throw new Error(`Connection failed: ${connError.message}`);
    }
    
    console.log('✅ Database connection successful');

    // Read the SQL setup file
    const sqlFilePath = path.join(__dirname, 'database-setup-fresh.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('SQL setup file not found: database-setup-fresh.sql');
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('📄 SQL setup file loaded successfully');

    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.startsWith('/*') || statement.trim().length === 0) {
        continue;
      }

      try {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
        
        // Use rpc to execute raw SQL
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });

        if (error) {
          console.warn(`⚠️ Statement ${i + 1} warning:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} failed:`, err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SETUP SUMMARY:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`⚠️ Warnings/Errors: ${errorCount}`);

    // Verify the setup by checking key tables
    console.log('\n🔍 Verifying database setup...');
    await verifySetup();

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

async function verifySetup() {
  const tablesToCheck = ['profiles', 'customers', 'subscription_plans', 'user_subscriptions'];
  
  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0} records`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  // Check for sample trial users
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('name, email, company_name, role, is_active')
      .eq('role', 'trial')
      .limit(5);

    if (!error && users && users.length > 0) {
      console.log('\n👥 Sample trial users found:');
      users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.name} (${user.email}) - ${user.company_name || 'No company'}`);
      });
    } else {
      console.log('⚠️ No trial users found');
    }
  } catch (err) {
    console.log('⚠️ Could not verify trial users:', err.message);
  }

  console.log('\n🎉 Database verification complete!');
  console.log('🚀 Your AdminMasterDashboard should now show real trial users');
  console.log('📧 Remember to update the admin email in the profiles table');
}

// Alternative method: Execute SQL using individual table operations
async function setupDatabaseAlternative() {
  console.log('🔄 Using alternative setup method...');
  
  try {
    // 1. Create profiles table data directly
    console.log('👥 Creating sample trial users...');
    
    const sampleUsers = [
      {
        id: 'user-001',
        email: 'parsuram@udhaysuriyantraders.com',
        name: 'Parsuram',
        full_name: 'Parsuram Sharma',
        phone: '+91-9876543210',
        company_name: 'UDHAY SURIYAN TRADERS',
        role: 'trial',
        account_type: 'trial',
        is_active: true,
        is_paid: false,
        trial_start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        trial_end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'user-002',
        email: 'ramesh@greenfarm.com',
        name: 'Ramesh Kumar',
        full_name: 'Ramesh Kumar Patel',
        phone: '+91-8765432109',
        company_name: 'Green Farm Enterprises',
        role: 'trial',
        account_type: 'trial',
        is_active: true,
        is_paid: false,
        trial_start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        trial_end_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'user-003',
        email: 'priya@agrotech.com',
        name: 'Priya Singh',
        full_name: 'Priya Singh',
        phone: '+91-7654321098',
        company_name: 'AgroTech Solutions',
        role: 'trial',
        account_type: 'trial',
        is_active: true,
        is_paid: false,
        trial_start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        trial_end_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'user-004',
        email: 'vikram@farmfresh.com',
        name: 'Vikram Gupta',
        full_name: 'Vikram Gupta',
        phone: '+91-6543210987',
        company_name: 'Farm Fresh Produce',
        role: 'paid',
        account_type: 'paid',
        is_active: true,
        is_paid: true,
        trial_start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        trial_end_date: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Insert users one by one
    for (const user of sampleUsers) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert(user, { onConflict: 'email' });

        if (error) {
          console.log(`⚠️ Could not insert user ${user.name}: ${error.message}`);
        } else {
          console.log(`✅ Inserted user: ${user.name} (${user.email})`);
        }
      } catch (err) {
        console.log(`❌ Error inserting user ${user.name}: ${err.message}`);
      }
    }

    // 2. Create some sample customers
    console.log('\n🏢 Creating sample customers...');
    
    const sampleCustomers = [
      {
        id: 'cust-001',
        name: 'ABC Distributors',
        phone: '+91-9999888877',
        email: 'abc@distributors.com',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'cust-002',
        name: 'XYZ Retailers',
        phone: '+91-8888777766',
        email: 'xyz@retailers.com',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const customer of sampleCustomers) {
      try {
        const { error } = await supabase
          .from('customers')
          .upsert(customer);

        if (error) {
          console.log(`⚠️ Could not insert customer ${customer.name}: ${error.message}`);
        } else {
          console.log(`✅ Inserted customer: ${customer.name}`);
        }
      } catch (err) {
        console.log(`❌ Error inserting customer ${customer.name}: ${err.message}`);
      }
    }

    console.log('\n✅ Alternative setup complete!');
    await verifySetup();

  } catch (error) {
    console.error('❌ Alternative setup failed:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await setupDatabase();
  } catch (error) {
    console.log('\n🔄 Primary method failed, trying alternative approach...');
    try {
      await setupDatabaseAlternative();
    } catch (altError) {
      console.error('\n❌ Both setup methods failed');
      console.error('💡 Please run the SQL manually in Supabase Dashboard');
      process.exit(1);
    }
  }
}

// Run the setup
main();