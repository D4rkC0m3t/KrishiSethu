import React, { useState } from 'react';

const RawFetchTest = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, status, data) => {
    setResults(prev => [...prev, { test, status, data, timestamp: new Date().toISOString() }]);
  };

  const clearResults = () => setResults([]);

  const testBasicFetch = async () => {
    try {
      setLoading(true);
      addResult('Basic Fetch Test', 'TESTING', 'Testing basic fetch to google.com...');
      
      const response = await fetch('https://www.google.com', {
        method: 'HEAD', // Use HEAD to avoid CORS issues
        mode: 'no-cors' // Allow no-cors mode
      });
      
      addResult('Basic Fetch Test', 'SUCCESS', `Status: ${response.status}, Type: ${response.type}`);
    } catch (error) {
      addResult('Basic Fetch Test', 'ERROR', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseAPI = async () => {
    try {
      setLoading(true);
      addResult('Supabase API Test', 'TESTING', 'Testing fetch to Supabase API...');
      
      console.log('Making direct fetch to Supabase...');
      
      const response = await fetch('https://lnljcgttcdhrduixirgf.supabase.co/rest/v1/', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response received:', response.status);
      
      const data = await response.json();
      console.log('Data parsed:', data);
      
      addResult('Supabase API Test', 'SUCCESS', `Status: ${response.status}, Response type: ${typeof data}`);
    } catch (error) {
      console.error('Fetch error:', error);
      addResult('Supabase API Test', 'ERROR', `${error.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseAuth = async () => {
    try {
      setLoading(true);
      addResult('Supabase Auth Test', 'TESTING', 'Testing Supabase auth endpoint...');
      
      const response = await fetch('https://lnljcgttcdhrduixirgf.supabase.co/auth/v1/settings', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      addResult('Supabase Auth Test', 'SUCCESS', `Status: ${response.status}, Has Settings: ${!!data}`);
    } catch (error) {
      addResult('Supabase Auth Test', 'ERROR', `${error.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWithDifferentModes = async () => {
    const modes = ['cors', 'no-cors', 'same-origin'];
    
    for (const mode of modes) {
      try {
        setLoading(true);
        addResult(`Fetch Mode Test (${mode})`, 'TESTING', `Testing with mode: ${mode}`);
        
        const response = await fetch('https://lnljcgttcdhrduixirgf.supabase.co/rest/v1/', {
          method: 'GET',
          mode: mode,
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo'
          }
        });
        
        addResult(`Fetch Mode Test (${mode})`, 'SUCCESS', `Status: ${response.status}, Type: ${response.type}`);
      } catch (error) {
        addResult(`Fetch Mode Test (${mode})`, 'ERROR', `${error.name}: ${error.message}`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Raw Fetch Diagnostic Tool</h1>
        <p className="text-gray-600 mb-4">
          This tool tests raw fetch requests to isolate network/browser issues.
        </p>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={testBasicFetch}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Basic Fetch
          </button>
          
          <button
            onClick={testSupabaseAPI}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Supabase API
          </button>
          
          <button
            onClick={testSupabaseAuth}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Test Supabase Auth
          </button>
          
          <button
            onClick={testWithDifferentModes}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            Test Different Modes
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
        <h3 className="font-medium text-gray-800 mb-2">Environment Info:</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div>User Agent: {navigator.userAgent}</div>
          <div>Location: {window.location.href}</div>
          <div>Protocol: {window.location.protocol}</div>
          <div>Host: {window.location.host}</div>
        </div>
      </div>
    </div>
  );
};

export default RawFetchTest;
