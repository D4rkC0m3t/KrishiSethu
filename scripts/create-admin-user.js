const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please ensure REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('🚀 Creating admin user...');
  
  const adminCredentials = {
    email: 'ArjunPeter@KrishiSethu.com',
    password: 'DarkDante@143'
  };

  try {
    // First, try to sign up the admin user
    console.log('📝 Attempting to create admin user:', adminCredentials.email);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: adminCredentials.email,
      password: adminCredentials.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'admin',
        name: 'Arjun Peter',
        is_admin: true
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('ℹ️  Admin user already exists, updating password...');
        
        // Update existing user password
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
          signUpData?.user?.id || 'find-by-email',
          {
            password: adminCredentials.password,
            user_metadata: {
              role: 'admin',
              name: 'Arjun Peter',
              is_admin: true
            }
          }
        );

        if (updateError) {
          console.error('❌ Error updating admin user:', updateError.message);
          return false;
        }
        
        console.log('✅ Admin user password updated successfully');
      } else {
        console.error('❌ Error creating admin user:', signUpError.message);
        return false;
      }
    } else {
      console.log('✅ Admin user created successfully');
      console.log('👤 User ID:', signUpData.user.id);
      console.log('📧 Email:', signUpData.user.email);
    }

    // Verify the user can sign in
    console.log('🔐 Testing admin login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminCredentials.email,
      password: adminCredentials.password
    });

    if (signInError) {
      console.error('❌ Admin login test failed:', signInError.message);
      return false;
    }

    console.log('✅ Admin login test successful');
    console.log('🎉 Admin user setup complete!');
    
    // Sign out after test
    await supabase.auth.signOut();
    
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Alternative method: Create user via direct database insertion (if auth.admin doesn't work)
async function createAdminUserDirect() {
  console.log('🔄 Trying alternative method: Direct database approach...');
  
  try {
    // This would require direct database access or custom SQL functions
    console.log('ℹ️  For direct database approach, you would need to:');
    console.log('1. Access your Supabase dashboard');
    console.log('2. Go to Authentication > Users');
    console.log('3. Click "Add user" manually');
    console.log('4. Use email: ArjunPeter@KrishiSethu.com');
    console.log('5. Use password: DarkDante@143');
    console.log('6. Set user metadata: {"role": "admin", "is_admin": true}');
    
    return false;
  } catch (error) {
    console.error('❌ Direct method error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔧 KrishiSethu Admin User Setup');
  console.log('================================');
  
  const success = await createAdminUser();
  
  if (!success) {
    console.log('\n🔄 Trying alternative approach...');
    await createAdminUserDirect();
  }
  
  console.log('\n📋 Admin Credentials:');
  console.log('Email: ArjunPeter@KrishiSethu.com');
  console.log('Password: DarkDante@143');
  console.log('\n🌐 Access URL: http://localhost:3000/admin');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createAdminUser };
