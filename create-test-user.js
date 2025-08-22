const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-application-name': 'krishisethu' }
  }
});

async function createTestUser() {
  console.log('🚀 Creating test user using frontend flow...');
  console.log('='.repeat(50));
  
  const userCredentials = {
    email: 'admin@krishisethu.com', // Try with the same domain as the app
    password: 'AdminPass123'
  };
  
  console.log('📝 Attempting to create user:', userCredentials.email);
  
  try {
    // Use the same signup flow as the frontend
    const { data, error } = await supabase.auth.signUp({
      email: userCredentials.email,
      password: userCredentials.password,
      options: {
        data: {
          name: 'Admin User',
          phone: '+91-9876543210',
          company_name: 'KrishiSethu Admin'
        }
      }
    });

    if (error) {
      console.log('❌ Signup failed:', error.message);
      
      // Try different email patterns
      const alternativeEmails = [
        'admin@example.com',
        'test@krishisethu.app', 
        'admin@krishisethu.app',
        'user@demo.com'
      ];
      
      console.log('\n🔄 Trying alternative email patterns...');
      
      for (const email of alternativeEmails) {
        console.log(`\n   Testing: ${email}`);
        
        try {
          const { data: altData, error: altError } = await supabase.auth.signUp({
            email,
            password: userCredentials.password,
            options: {
              data: {
                name: 'Test Admin',
                phone: '+91-9876543210',
                company_name: 'Test Company'
              }
            }
          });
          
          if (altError) {
            console.log(`   ❌ ${email}: ${altError.message}`);
          } else {
            console.log(`   ✅ ${email}: Registration successful!`);
            console.log(`   User ID: ${altData.user?.id}`);
            console.log(`   Email confirmed: ${altData.user?.email_confirmed_at ? 'Yes' : 'No'}`);
            
            // Test login immediately
            console.log(`   🔐 Testing login...`);
            const loginResult = await testLogin(email, userCredentials.password);
            
            if (loginResult) {
              console.log(`   🎉 SUCCESS! Working credentials found:`);
              console.log(`   📧 Email: ${email}`);
              console.log(`   🔑 Password: ${userCredentials.password}`);
              return { email, password: userCredentials.password };
            }
          }
        } catch (err) {
          console.log(`   ❌ ${email}: Error - ${err.message}`);
        }
      }
    } else {
      console.log('✅ Signup successful!');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
      console.log('Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
      
      // Test login
      console.log('\n🔐 Testing login...');
      const loginResult = await testLogin(userCredentials.email, userCredentials.password);
      
      if (loginResult) {
        return userCredentials;
      }
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  
  return null;
}

async function testLogin(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log('   ❌ Login failed:', error.message);
      return false;
    } else {
      console.log('   ✅ Login successful!');
      
      // Try to load/create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError && !profileError.message.includes('No rows')) {
        console.log('   ⚠️ Profile lookup error:', profileError.message);
      } else if (!profile) {
        console.log('   ℹ️ No profile found, this might need to be created');
      } else {
        console.log('   ✅ Profile found:', profile.email);
      }
      
      // Sign out after test
      await supabase.auth.signOut();
      return true;
    }
  } catch (err) {
    console.log('   ❌ Login error:', err.message);
    return false;
  }
}

// Main execution
async function main() {
  const result = await createTestUser();
  
  if (result) {
    console.log('\n🎉 SUCCESS! You can now login with:');
    console.log('📧 Email:', result.email);
    console.log('🔑 Password:', result.password);
    console.log('\n🌐 Try logging in at: http://localhost:3000/login');
  } else {
    console.log('\n❌ Could not create any working user account');
    console.log('\n💡 Next steps:');
    console.log('1. Check your Supabase Dashboard > Authentication settings');
    console.log('2. Verify that user signups are enabled');
    console.log('3. Check if email confirmations are required');
    console.log('4. Look for any domain restrictions or custom policies');
  }
}

main().catch(console.error);
