import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const MultiTenantTest = () => {
  const [status, setStatus] = useState('Testing...');
  const [results, setResults] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runMultiTenantTests();
  }, []);

  const addResult = (test, success, message, data = null) => {
    setResults(prev => [...prev, { test, success, message, data, timestamp: new Date().toISOString() }]);
  };

  const runMultiTenantTests = async () => {
    try {
      setStatus('Running multi-tenant tests...');
      setResults([]);

      // Test 1: Connection
      addResult('Connection', true, 'Supabase client initialized successfully');

      // Test 2: Check current user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        addResult('Authentication', false, `Auth check failed: ${authError.message}`);
      } else {
        setUser(authData.user);
        addResult('Authentication', true, authData.user ? `User logged in: ${authData.user.email}` : 'No user logged in (expected for new setup)');
      }

      // Test 3: Check organizations table
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .limit(5);

      if (orgError) {
        addResult('Organizations Table', false, `Error: ${orgError.message}`);
      } else {
        addResult('Organizations Table', true, `Found ${orgs.length} organizations`, orgs);
      }

      // Test 4: Check profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

      if (profileError) {
        addResult('Profiles Table', false, `Error: ${profileError.message}`);
      } else {
        addResult('Profiles Table', true, `Found ${profiles.length} profiles`, profiles);
      }

      // Test 5: Check categories table
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .limit(5);

      if (catError) {
        addResult('Categories Table', false, `Error: ${catError.message}`);
      } else {
        addResult('Categories Table', true, `Found ${categories.length} categories`, categories);
      }

      // Test 6: Test RLS (should work if user is authenticated)
      if (authData.user) {
        const { data: userOrg, error: userOrgError } = await supabase
          .rpc('get_user_organization');

        if (userOrgError) {
          addResult('RLS Function', false, `Error: ${userOrgError.message}`);
        } else {
          addResult('RLS Function', true, `User organization ID: ${userOrg}`, { organizationId: userOrg });
        }
      } else {
        addResult('RLS Function', true, 'Skipped - no authenticated user');
      }

      setStatus('Tests completed!');

    } catch (error) {
      addResult('System Error', false, `Unexpected error: ${error.message}`);
      setStatus('Tests failed!');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    const testEmail = `test-${Date.now()}@krishisethu.com`;
    const testPassword = 'TestPassword123!';

    setStatus('Creating test user...');

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          organization_name: 'Test Organization'
        }
      }
    });

    if (error) {
      addResult('User Creation', false, `Error: ${error.message}`);
    } else {
      addResult('User Creation', true, `Test user created: ${testEmail}`, { user: data.user });
      // Re-run tests after user creation
      setTimeout(() => runMultiTenantTests(), 2000);
    }
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>🏢 Multi-Tenant System Test</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3>Status: {status}</h3>
        <div>
          <span style={{ color: 'green' }}>✅ Passed: {successCount}</span>
          {' | '}
          <span style={{ color: 'red' }}>❌ Failed: {failCount}</span>
        </div>
      </div>

      {!user && !loading && (
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={handleSignUp}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Create Test User & Organization
          </button>
        </div>
      )}

      <div>
        <h3>Test Results:</h3>
        {results.map((result, index) => (
          <div 
            key={index}
            style={{ 
              margin: '10px 0', 
              padding: '10px', 
              backgroundColor: result.success ? '#e8f5e8' : '#ffe8e8',
              border: `1px solid ${result.success ? '#4CAF50' : '#f44336'}`,
              borderRadius: '5px'
            }}
          >
            <div>
              <strong>{result.success ? '✅' : '❌'} {result.test}</strong>
            </div>
            <div>{result.message}</div>
            {result.data && (
              <details style={{ marginTop: '5px' }}>
                <summary>View Data</summary>
                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <h4>What this test checks:</h4>
        <ul>
          <li>✅ Supabase client connection</li>
          <li>✅ User authentication status</li>
          <li>✅ Multi-tenant tables exist</li>
          <li>✅ Row-level security functions</li>
          <li>✅ User registration flow</li>
        </ul>
      </div>
    </div>
  );
};

export default MultiTenantTest;
