// Test script to verify the login fix
// Run this in your browser console after attempting login

console.log('=== Login Fix Test ===');

// Test 1: Check if Supabase client is properly configured
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Supabase client is available');
} else {
  console.log('❌ Supabase client not found');
}

// Test 2: Check auth state
const checkAuthState = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('✅ User is authenticated:', session.user.email);
      
      // Test 3: Check if profile exists
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error) {
        console.log('❌ Profile error:', error.message);
      } else {
        console.log('✅ Profile loaded:', profile);
      }
    } else {
      console.log('ℹ️ No active session');
    }
  } catch (error) {
    console.log('❌ Auth check error:', error.message);
  }
};

// Test 4: Check auth.users token fields
const checkTokenFields = async () => {
  try {
    // This would require admin access, so we'll skip for now
    console.log('ℹ️ Token field check requires admin access');
  } catch (error) {
    console.log('❌ Token check error:', error.message);
  }
};

// Run tests
checkAuthState();

console.log('=== Test Complete ===');
console.log('If you see errors, please share them for further debugging.');