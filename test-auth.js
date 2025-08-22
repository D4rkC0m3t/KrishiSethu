const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔧 Testing Supabase Authentication');
console.log('='.repeat(40));
console.log('URL:', supabaseUrl);
console.log('Key (first 20):', supabaseAnonKey?.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCredentials() {
  console.log('\n1. Testing the original credentials from the browser...');
  
  // Test the credentials shown in the browser form
  const originalCredentials = {
    email: 'ArjunPeter@krishisethu.com',
    password: 'AdrinLamo@143'
  };
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword(originalCredentials);
    
    if (error) {
      console.log('❌ Original credentials failed:', error.message);
    } else {
      console.log('✅ Original credentials work!');
      console.log('User:', data.user.email);
      await supabase.auth.signOut();
      return true;
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  
  console.log('\n2. Testing the admin script credentials...');
  
  const adminCredentials = {
    email: 'ArjunPeter@KrishiSethu.com',
    password: 'DarkDante@143'
  };
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword(adminCredentials);
    
    if (error) {
      console.log('❌ Admin credentials failed:', error.message);
    } else {
      console.log('✅ Admin credentials work!');
      console.log('User:', data.user.email);
      await supabase.auth.signOut();
      return true;
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  
  console.log('\n3. Attempting to register a new user...');
  
  // Try different email formats to see which one works
  const emailsToTry = [
    'admin@example.com',
    'test@gmail.com',  
    'arjun@krishisethu.com',
    'test@test.com'
  ];
  
  for (const email of emailsToTry) {
    console.log(`\n   Trying email: ${email}`);
    const testUser = { email, password: 'TestPass123' };
    
    try {
      const { data, error } = await supabase.auth.signUp(testUser);
      
      if (error) {
        console.log(`   ❌ ${email} failed: ${error.message}`);
      } else {
        console.log(`   ✅ ${email} registration successful!`);
        console.log('   User ID:', data.user?.id);
        console.log('   Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
        
        // Test immediate login
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword(testUser);
        
        if (loginError) {
          console.log(`   ❌ Login failed: ${loginError.message}`);
        } else {
          console.log(`   ✅ Login successful!`);
          await supabase.auth.signOut();
          return true; // Success - we found working credentials
        }
      }
    } catch (err) {
      console.log(`   ❌ Error with ${email}:`, err.message);
    }
  }
  
  return false;
}

testCredentials().then(() => {
  console.log('\n🏁 Authentication test complete');
}).catch(console.error);
