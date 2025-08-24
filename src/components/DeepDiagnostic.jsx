import React, { useState } from 'react';

const DeepDiagnostic = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, status, data) => {
    setResults(prev => [...prev, { test, status, data, timestamp: new Date().toISOString() }]);
  };

  const compareConfigurations = async () => {
    try {
      setLoading(true);
      setResults([]);
      
      // Test 1: Compare URL values
      const hardcodedUrl = 'https://lnljcgttcdhrduixirgf.supabase.co';
      const envUrl = process.env.REACT_APP_SUPABASE_URL;
      
      addResult('URL Comparison', 'INFO', 
        `Hardcoded: "${hardcodedUrl}" | Env: "${envUrl}" | Equal: ${hardcodedUrl === envUrl}`);
      
      // Test 2: Compare Key values
      const hardcodedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo';
      const envKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      
      addResult('Key Comparison', 'INFO', 
        `Hardcoded Length: ${hardcodedKey.length} | Env Length: ${envKey?.length} | Equal: ${hardcodedKey === envKey}`);
      
      // Test 3: Character by character comparison for URL
      if (hardcodedUrl !== envUrl) {
        for (let i = 0; i < Math.max(hardcodedUrl.length, envUrl?.length || 0); i++) {
          if (hardcodedUrl[i] !== envUrl?.[i]) {
            addResult('URL Diff', 'ERROR', `Difference at position ${i}: hardcoded="${hardcodedUrl[i]}" env="${envUrl?.[i]}"`);
            break;
          }
        }
      }
      
      // Test 4: Character by character comparison for Key
      if (hardcodedKey !== envKey && envKey) {
        for (let i = 0; i < Math.max(hardcodedKey.length, envKey.length); i++) {
          if (hardcodedKey[i] !== envKey[i]) {
            addResult('Key Diff', 'ERROR', `Difference at position ${i}: hardcoded="${hardcodedKey[i]}" env="${envKey[i]}"`);
            break;
          }
        }
      }
      
      // Test 5: Create clients with exact same options but different sources
      const { createClient } = await import('@supabase/supabase-js');
      
      const workingClient = createClient(hardcodedUrl, hardcodedKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      
      const envClient = createClient(envUrl, envKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      
      addResult('Client Creation', 'SUCCESS', 'Both clients created successfully');
      
      // Test 6: Compare client internals
      const workingClientStr = JSON.stringify(workingClient, null, 2);
      const envClientStr = JSON.stringify(envClient, null, 2);
      
      addResult('Client Internals', workingClientStr === envClientStr ? 'SUCCESS' : 'ERROR',
        `Clients identical: ${workingClientStr === envClientStr}`);
      
      // Test 7: Test both clients with identical queries
      try {
        const { data: workingData, error: workingError } = await workingClient
          .from('organizations')
          .select('*')
          .limit(1);
          
        if (workingError) {
          addResult('Working Client Query', 'ERROR', workingError.message);
        } else {
          addResult('Working Client Query', 'SUCCESS', `Got ${workingData?.length} records`);
        }
      } catch (err) {
        addResult('Working Client Query', 'ERROR', err.message);
      }
      
      try {
        const { data: envData, error: envError } = await envClient
          .from('organizations')
          .select('*')
          .limit(1);
          
        if (envError) {
          addResult('Env Client Query', 'ERROR', envError.message);
        } else {
          addResult('Env Client Query', 'SUCCESS', `Got ${envData?.length} records`);
        }
      } catch (err) {
        addResult('Env Client Query', 'ERROR', err.message);
      }
      
      // Test 8: Test the imported client
      try {
        const { supabase: importedClient } = await import('../lib/supabase');
        
        const { data: importedData, error: importedError } = await importedClient
          .from('organizations')
          .select('*')
          .limit(1);
          
        if (importedError) {
          addResult('Imported Client Query', 'ERROR', importedError.message);
        } else {
          addResult('Imported Client Query', 'SUCCESS', `Got ${importedData?.length} records`);
        }
      } catch (err) {
        addResult('Imported Client Query', 'ERROR', err.message);
      }
      
      // Test 9: Raw fetch with both URLs
      try {
        const hardcodedResponse = await fetch(`${hardcodedUrl}/rest/v1/organizations?select=*&limit=1`, {
          headers: {
            'apikey': hardcodedKey,
            'Content-Type': 'application/json'
          }
        });
        
        addResult('Hardcoded Raw Fetch', hardcodedResponse.ok ? 'SUCCESS' : 'ERROR',
          `Status: ${hardcodedResponse.status}`);
      } catch (err) {
        addResult('Hardcoded Raw Fetch', 'ERROR', err.message);
      }
      
      try {
        const envResponse = await fetch(`${envUrl}/rest/v1/organizations?select=*&limit=1`, {
          headers: {
            'apikey': envKey,
            'Content-Type': 'application/json'
          }
        });
        
        addResult('Env Raw Fetch', envResponse.ok ? 'SUCCESS' : 'ERROR',
          `Status: ${envResponse.status}`);
      } catch (err) {
        addResult('Env Raw Fetch', 'ERROR', err.message);
      }
      
    } catch (error) {
      addResult('Deep Diagnostic Error', 'ERROR', error.message);
    } finally {
      setLoading(false);
    }
  };

  const logAllEnvironmentVariables = () => {
    addResult('All Env Vars', 'INFO', 'Logging all REACT_APP_ environment variables...');
    
    // Get all environment variables that start with REACT_APP_
    const envVars = Object.keys(process.env)
      .filter(key => key.startsWith('REACT_APP_'))
      .reduce((obj, key) => {
        obj[key] = process.env[key];
        return obj;
      }, {});
    
    addResult('Environment Variables', 'INFO', JSON.stringify(envVars, null, 2));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Deep Diagnostic Analysis</h1>
        <p className="text-gray-600 mb-4">
          Detailed comparison between working and failing Supabase clients.
        </p>
        
        <div className="flex gap-3 mb-4">
          <button
            onClick={compareConfigurations}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Deep Compare Clients
          </button>
          
          <button
            onClick={logAllEnvironmentVariables}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Log All Env Vars
          </button>
          
          <button
            onClick={() => setResults([])}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Results
          </button>
        </div>
        
        {loading && (
          <div className="text-blue-600 font-medium">Running deep analysis...</div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Analysis Results:</h2>
        
        {results.length === 0 ? (
          <div className="text-gray-500 italic">No analysis run yet. Click a button above.</div>
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
              <div className="text-sm whitespace-pre-wrap font-mono">{result.data}</div>
              <div className="text-xs opacity-70 mt-2">{result.timestamp}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeepDiagnostic;
