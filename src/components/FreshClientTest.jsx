import React, { useState } from 'react';

const FreshClientTest = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, status, data) => {
    setResults(prev => [...prev, { test, status, data, timestamp: new Date().toISOString() }]);
  };

  const clearResults = () => setResults([]);

  const clearAllCaches = () => {
    // Clear all possible caches
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any Supabase specific items
    ['sb-lnljcgttcdhrduixirgf-auth-token', 'supabase.auth.token', 'ks_debug_sb_url', 'ks_debug_sb_anon_key'].forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    addResult('Cache Clear', 'SUCCESS', 'All caches cleared');
  };

  const testWithFreshClient = async () => {
    try {
      setLoading(true);
      addResult('Fresh Client Test', 'TESTING', 'Creating completely fresh client...');
      
      // Import fresh
      const { createClient } = await import('@supabase/supabase-js');
      
      // Create the most minimal client possible
      const freshClient = createClient(
        'https://lnljcgttcdhrduixirgf.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo'
        // No options at all
      );
      
      addResult('Fresh Client Test', 'SUCCESS', 'Fresh client created');
      
      // Test a simple query
      const { data, error } = await freshClient
        .from('organizations')
        .select('*')
        .limit(1);
        
      if (error) {
        addResult('Fresh Query Test', 'ERROR', `Query failed: ${error.message}`);
      } else {
        addResult('Fresh Query Test', 'SUCCESS', `Query succeeded. Records: ${data?.length || 0}`);
      }
      
    } catch (error) {
      addResult('Fresh Client Test', 'ERROR', `${error.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testEnvironmentVariables = () => {
    addResult('Env Var Test', 'TESTING', 'Checking environment variables...');
    
    const url = process.env.REACT_APP_SUPABASE_URL;
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    addResult('Env Variables', url && key ? 'SUCCESS' : 'ERROR', 
      `URL: ${url ? 'SET' : 'MISSING'}, Key: ${key ? 'SET (' + key.length + ' chars)' : 'MISSING'}`);
  };

  const testWithEnvVariables = async () => {
    try {
      setLoading(true);
      addResult('Env Client Test', 'TESTING', 'Testing with environment variables...');
      
      const url = process.env.REACT_APP_SUPABASE_URL;
      const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        addResult('Env Client Test', 'ERROR', 'Missing environment variables');
        return;
      }
      
      const { createClient } = await import('@supabase/supabase-js');
      const envClient = createClient(url, key);
      
      const { data, error } = await envClient
        .from('organizations')
        .select('*')
        .limit(1);
        
      if (error) {
        addResult('Env Client Test', 'ERROR', `Query failed: ${error.message}`);
      } else {
        addResult('Env Client Test', 'SUCCESS', `Query succeeded. Records: ${data?.length || 0}`);
      }
      
    } catch (error) {
      addResult('Env Client Test', 'ERROR', `${error.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testImportedClient = async () => {
    try {
      setLoading(true);
      addResult('Imported Client Test', 'TESTING', 'Testing imported client...');
      
      // Dynamically import to get fresh instance
      const { supabase } = await import('../lib/supabase');
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .limit(1);
        
      if (error) {
        addResult('Imported Client Test', 'ERROR', `Query failed: ${error.message}`);
      } else {
        addResult('Imported Client Test', 'SUCCESS', `Query succeeded. Records: ${data?.length || 0}`);
      }
      
    } catch (error) {
      addResult('Imported Client Test', 'ERROR', `${error.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const hardRefresh = () => {
    clearAllCaches();
    window.location.reload(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Fresh Client Test & Cache Clear</h1>
        <p className="text-gray-600 mb-4">
          Test with completely fresh Supabase clients and clear all caches.
        </p>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={clearAllCaches}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear All Caches
          </button>
          
          <button
            onClick={testEnvironmentVariables}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Env Variables
          </button>
          
          <button
            onClick={testWithFreshClient}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Fresh Client
          </button>
          
          <button
            onClick={testWithEnvVariables}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Test Env Client
          </button>
          
          <button
            onClick={testImportedClient}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            Test Imported Client
          </button>
          
          <button
            onClick={hardRefresh}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
          >
            Hard Refresh Page
          </button>
          
          <button
            onClick={clearResults}
            disabled={loading}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Clear Results
          </button>
        </div>
        
        {loading && (
          <div className="text-blue-600 font-medium">Running tests...</div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Test Results:</h2>
        
        {results.length === 0 ? (
          <div className="text-gray-500 italic">No tests run yet. Click a test button above.</div>
        ) : (
          results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                result.status === 'SUCCESS'
                  ? 'bg-green-50 border-green-500 text-green-800'
                  : result.status === 'ERROR'
                  ? 'bg-red-50 border-red-500 text-red-800'
                  : 'bg-blue-50 border-blue-500 text-blue-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{result.test}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  result.status === 'SUCCESS'
                    ? 'bg-green-200 text-green-800'
                    : result.status === 'ERROR'
                    ? 'bg-red-200 text-red-800'
                    : 'bg-blue-200 text-blue-800'
                }`}>
                  {result.status}
                </span>
              </div>
              <div className="text-sm">{result.data}</div>
              <div className="text-xs opacity-70 mt-2">{result.timestamp}</div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">Debug Info:</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Location: {window.location.href}</div>
          <div>LocalStorage keys: {Object.keys(localStorage).join(', ')}</div>
          <div>SessionStorage keys: {Object.keys(sessionStorage).join(', ')}</div>
        </div>
      </div>
    </div>
  );
};

export default FreshClientTest;
