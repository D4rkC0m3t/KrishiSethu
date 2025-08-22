import { supabase } from '../lib/supabase.js';

/**
 * Comprehensive database connectivity test to diagnose timeout issues
 */
export const runConnectivityTest = async () => {
  console.log('🔍 Starting database connectivity diagnostics...');
  
  const results = {
    auth: { status: 'pending', message: '', timestamp: new Date() },
    basicQuery: { status: 'pending', message: '', timestamp: new Date() },
    userTables: { status: 'pending', message: '', timestamp: new Date() },
    permissions: { status: 'pending', message: '', timestamp: new Date() }
  };

  try {
    // Test 1: Check authentication status
    console.log('🔐 Test 1: Checking authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      results.auth = { status: 'failed', message: `Auth error: ${authError.message}`, timestamp: new Date() };
      console.error('❌ Authentication test failed:', authError);
    } else if (user) {
      results.auth = { status: 'success', message: `Authenticated as: ${user.email}`, timestamp: new Date() };
      console.log('✅ Authentication test passed:', user.email);
    } else {
      results.auth = { status: 'failed', message: 'No authenticated user', timestamp: new Date() };
      console.error('❌ No authenticated user found');
    }

    // Test 2: Basic connectivity with very short timeout
    console.log('🌐 Test 2: Basic connectivity test...');
    try {
      // Create a promise that will timeout after 5 seconds
      const basicQueryPromise = supabase.rpc('version').single();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Basic query timeout after 5 seconds')), 5000);
      });

      const versionResult = await Promise.race([basicQueryPromise, timeoutPromise]);
      
      results.basicQuery = { 
        status: 'success', 
        message: `Database version: ${versionResult?.data || 'Connected'}`, 
        timestamp: new Date() 
      };
      console.log('✅ Basic connectivity test passed');
    } catch (basicError) {
      results.basicQuery = { 
        status: 'failed', 
        message: `Basic query failed: ${basicError.message}`, 
        timestamp: new Date() 
      };
      console.error('❌ Basic connectivity test failed:', basicError);
    }

    // Test 3: Test access to user tables with different timeouts
    console.log('👥 Test 3: Testing user table access...');
    const tables = ['users', 'profiles', 'user_profiles'];
    const tableResults = {};
    
    for (const table of tables) {
      try {
        console.log(`  🔍 Testing ${table} table...`);
        
        // Create a promise with 3-second timeout
        const queryPromise = supabase
          .from(table)
          .select('*')
          .limit(1);
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`${table} query timeout after 3 seconds`)), 3000);
        });

        const result = await Promise.race([queryPromise, timeoutPromise]);
        
        if (result.error) {
          tableResults[table] = { status: 'failed', message: result.error.message };
          console.error(`  ❌ ${table} table access failed:`, result.error);
        } else {
          tableResults[table] = { 
            status: 'success', 
            message: `Found ${result.data?.length || 0} records` 
          };
          console.log(`  ✅ ${table} table accessible, found ${result.data?.length || 0} records`);
        }
      } catch (tableError) {
        tableResults[table] = { status: 'failed', message: tableError.message };
        console.error(`  ❌ ${table} table test failed:`, tableError);
      }
    }
    
    results.userTables = { 
      status: Object.values(tableResults).some(r => r.status === 'success') ? 'partial' : 'failed',
      message: JSON.stringify(tableResults, null, 2),
      timestamp: new Date()
    };

    // Test 4: Check permissions more specifically
    console.log('🔒 Test 4: Testing specific permissions...');
    try {
      // Try to get current user's information from auth.users (if accessible)
      const permissionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Permission test timeout after 3 seconds')), 3000);
      });

      const sessionResult = await Promise.race([permissionPromise, timeoutPromise]);
      
      if (sessionResult.data?.session) {
        results.permissions = {
          status: 'success',
          message: `Valid session for user: ${sessionResult.data.session.user.email}`,
          timestamp: new Date()
        };
        console.log('✅ Permissions test passed - valid session found');
      } else {
        results.permissions = {
          status: 'failed',
          message: 'No valid session found',
          timestamp: new Date()
        };
        console.error('❌ Permissions test failed - no valid session');
      }
    } catch (permError) {
      results.permissions = {
        status: 'failed',
        message: `Permission test failed: ${permError.message}`,
        timestamp: new Date()
      };
      console.error('❌ Permissions test failed:', permError);
    }

  } catch (generalError) {
    console.error('❌ General connectivity test error:', generalError);
  }

  // Summary
  console.log('📊 Connectivity Test Summary:');
  console.log('  Authentication:', results.auth.status, '-', results.auth.message);
  console.log('  Basic Query:', results.basicQuery.status, '-', results.basicQuery.message);
  console.log('  User Tables:', results.userTables.status, '-', 'See details above');
  console.log('  Permissions:', results.permissions.status, '-', results.permissions.message);
  
  return results;
};

/**
 * Simple ping test to check basic Supabase connectivity
 */
export const quickPingTest = async (timeoutMs = 2000) => {
  console.log(`🏓 Quick ping test (${timeoutMs}ms timeout)...`);
  
  try {
    const pingPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Ping timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    const result = await Promise.race([pingPromise, timeoutPromise]);
    console.log('✅ Quick ping successful');
    return { success: true, message: 'Ping successful', data: result };
  } catch (error) {
    console.error('❌ Quick ping failed:', error);
    return { success: false, message: error.message, error };
  }
};
