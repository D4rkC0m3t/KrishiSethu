import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SimpleSupabaseTest = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, status, data) => {
    setResults(prev => [...prev, { test, status, data, timestamp: new Date().toISOString() }]);
  };

  const clearResults = () => setResults([]);

  const testBasicClient = async () => {
    try {
      setLoading(true);
      addResult('Basic Client Test', 'TESTING', 'Creating Supabase client...');
      
      // Create a minimal client with no options
      const client = createClient(
        'https://lnljcgttcdhrduixirgf.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo'
      );
      
      addResult('Basic Client Test', 'SUCCESS', `Client created: ${!!client}`);
    } catch (error) {
      addResult('Basic Client Test', 'ERROR', `${error.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testClientWithMinimalOptions = async () => {
    try {
      setLoading(true);
      addResult('Minimal Options Client', 'TESTING', 'Creating client with minimal options...');
      
      const client = createClient(
        'https://lnljcgttcdhrduixirgf.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo',
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );
      
      addResult('Minimal Options Client', 'SUCCESS', `Client created: ${!!client}`);
    } catch (error) {
      addResult('Minimal Options Client', 'ERROR', `${error.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSimpleQuery = async () => {
    try {
      setLoading(true);
      addResult('Simple Query Test', 'TESTING', 'Testing simple query...');
      
      const client = createClient(
        'https://lnljcgttcdhrduixirgf.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo',
        {
          auth: { persistSession: false },
          db: { schema: 'public' }
        }
      );
      
      const { data, error } = await client
        .from('organizations')
        .select('*')
        .limit(1);
      
      if (error) {
        addResult('Simple Query Test', 'ERROR', `Query failed: ${error.message}`);
      } else {
        addResult('Simple Query Test', 'SUCCESS', `Query succeeded. Records: ${data?.length || 0}`);
      }
    } catch (error) {
      addResult('Simple Query Test', 'ERROR', `${error.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuthEndpoint = async () => {
    try {
      setLoading(true);
      addResult('Auth Endpoint Test', 'TESTING', 'Testing auth endpoint...');
      
      const client = createClient(
        'https://lnljcgttcdhrduixirgf.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo',
        {
          auth: { persistSession: false }
        }
      );
      
      // Get session to see if auth works
      const { data: session, error } = await client.auth.getSession();
      
      if (error) {
        addResult('Auth Endpoint Test', 'ERROR', `Auth failed: ${error.message}`);
      } else {
        addResult('Auth Endpoint Test', 'SUCCESS', `Auth working. Session: ${session ? 'exists' : 'null'}`);
      }
    } catch (error) {
      addResult('Auth Endpoint Test', 'ERROR', `${error.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWithDifferentFetch = async () => {
    try {
      setLoading(true);
      addResult('Custom Fetch Test', 'TESTING', 'Testing with custom fetch...');
      
      // Create a custom fetch that logs everything
      const customFetch = async (input, init) => {
        console.log('🔍 Custom fetch called:', { input, init });
        try {
          const response = await fetch(input, init);
          console.log('✅ Custom fetch response:', { status: response.status, ok: response.ok });
          return response;
        } catch (error) {
          console.error('❌ Custom fetch error:', error);
          throw error;
        }
      };

      const client = createClient(
        'https://lnljcgttcdhrduixirgf.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo',
        {
          global: {
            fetch: customFetch
          }
        }
      );
      
      const { data, error } = await client
        .from('organizations')
        .select('count')
        .limit(1);
      
      if (error) {
        addResult('Custom Fetch Test', 'ERROR', `Query failed: ${error.message}`);
      } else {
        addResult('Custom Fetch Test', 'SUCCESS', `Custom fetch worked! Data: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      addResult('Custom Fetch Test', 'ERROR', `${error.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Simple Supabase Client Test</h1>
        <p className="text-gray-600 mb-4">
          Testing Supabase client creation and basic operations to isolate the issue.
        </p>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={testBasicClient}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Basic Client
          </button>
          
          <button
            onClick={testClientWithMinimalOptions}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Minimal Options
          </button>
          
          <button
            onClick={testSimpleQuery}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Test Simple Query
          </button>
          
          <button
            onClick={testAuthEndpoint}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            Test Auth Endpoint
          </button>

          <button
            onClick={testWithDifferentFetch}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Test Custom Fetch
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
    </div>
  );
};

export default SimpleSupabaseTest;
