import { supabase } from '../lib/supabase.js';

// Simple database connectivity test
export const testDatabaseConnection = async () => {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test 1: Basic connectivity - try a simple query
    const { data: basicTest, error: basicError } = await supabase
      .from('_dummy_test_table')
      .select('*')
      .limit(1);
      
    // We expect this to fail with table not found, which means connection works
    if (basicError && basicError.code === '42P01') {
      console.log('✅ Database connection is working (table not found is expected)');
    } else if (basicError) {
      console.error('❌ Database connection failed:', basicError);
      return { success: false, error: basicError.message };
    } else {
      console.log('✅ Database connection is working');
    }
    
    // Test 2: Check auth session
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 Current Session:', { 
      hasSession: !!session?.session, 
      hasUser: !!session?.session?.user,
      error: sessionError?.message 
    });
    
    // Test 3: Try to access user_profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role, trial_start_date, trial_end_date')
      .limit(1);
    
    console.log('👤 User Profiles Test:', { 
      hasData: !!profiles, 
      count: profiles?.length || 0,
      error: profileError?.message 
    });
    
    // Test 4: Check if current user has a profile
    if (session?.session?.user) {
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single();
      
      console.log('🎯 Current User Profile:', { 
        hasProfile: !!userProfile,
        profile: userProfile,
        error: userProfileError?.message 
      });
    }
    
    return { success: true, message: 'Database connection successful' };
    
  } catch (error) {
    console.error('💥 Database test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test authentication flow
export const testAuthFlow = async () => {
  console.log('🔐 Testing authentication flow...');
  
  try {
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('👤 Current User:', { 
      hasUser: !!userData?.user, 
      userId: userData?.user?.id,
      email: userData?.user?.email,
      error: userError?.message 
    });
    
    if (!userData?.user) {
      return { success: true, message: 'No user logged in (expected for login page)' };
    }
    
    // Try to load user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();
    
    console.log('📋 User Profile:', { 
      hasProfile: !!profile,
      role: profile?.role,
      trialStart: profile?.trial_start_date,
      trialEnd: profile?.trial_end_date,
      error: profileError?.message 
    });
    
    return { 
      success: true, 
      user: userData.user, 
      profile: profile,
      message: 'Auth flow test completed' 
    };
    
  } catch (error) {
    console.error('💥 Auth flow test failed:', error);
    return { success: false, error: error.message };
  }
};

// Run comprehensive diagnostics
export const runDiagnostics = async () => {
  console.log('🏥 Running comprehensive diagnostics...');
  
  const dbTest = await testDatabaseConnection();
  const authTest = await testAuthFlow();
  
  const results = {
    timestamp: new Date().toISOString(),
    database: dbTest,
    auth: authTest,
    overall: dbTest.success && authTest.success ? 'healthy' : 'issues_detected'
  };
  
  console.log('📊 Diagnostic Results:', results);
  return results;
};