const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔧 Testing Supabase Connection');
console.log('='.repeat(40));
console.log('URL:', supabaseUrl);
console.log('Key (first 20):', supabaseAnonKey?.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('\n1. Testing basic connection...');
  
  try {
    // Try a simple query that doesn't require authentication
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
      .limit(0);
      
    if (error) {
      if (error.message.includes('relation "public.profiles" does not exist')) {
        console.log('⚠️ Connection works but profiles table does not exist');
        console.log('This means the database schema has not been set up yet.');
      } else if (error.code === 'PGRST116') {
        console.log('⚠️ Connection works but access denied (RLS policy)');
      } else {
        console.log('❌ Connection error:', error.message);
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('Profiles table exists with', data?.length || 0, 'records');
    }
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  }
  
  console.log('\n2. Testing auth configuration...');
  
  // Test auth settings with an obviously fake email to see the response
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nonexistent@example.com',
      password: 'fakepassword'
    });
    
    if (error) {
      console.log('Auth error (expected):', error.message);
      
      // Check what kind of error we get
      if (error.message === 'Invalid login credentials') {
        console.log('✅ Auth is working (credentials just don\'t exist)');
      } else if (error.message.includes('Email address') && error.message.includes('invalid')) {
        console.log('⚠️ Email validation is very strict or sign-ups are restricted');
      } else {
        console.log('❌ Unexpected auth error:', error.message);
      }
    } else {
      console.log('Unexpected success with fake credentials');
    }
  } catch (err) {
    console.log('Auth test error:', err.message);
  }
  
  console.log('\n3. Checking auth configuration...');
  
  try {
    // Try to get current session (should be null)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('Session check error:', error.message);
    } else {
      console.log('Session check successful, current session:', session ? 'Active' : 'None');
    }
  } catch (err) {
    console.log('Session check failed:', err.message);
  }
}

testConnection().then(() => {
  console.log('\n🏁 Connection test complete');
  
  console.log('\n💡 Recommendations:');
  console.log('1. Check Supabase Dashboard > Authentication > Settings');
  console.log('2. Verify "Enable email confirmations" setting');
  console.log('3. Check if there are email domain restrictions');
  console.log('4. Look for any custom email validation rules');
  console.log('5. Ensure sign-ups are enabled');
  
}).catch(console.error);
