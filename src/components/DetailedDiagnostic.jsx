import React, { useState, useEffect } from 'react';

const DetailedDiagnostic = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const addResult = (test, success, message, details = null) => {
    setResults(prev => [...prev, { test, success, message, details, timestamp: new Date().toISOString() }]);
  };

  useEffect(() => {
    runDetailedDiagnostics();
  }, []);

  const runDetailedDiagnostics = async () => {
    try {
      setResults([]);

      // Test 1: Environment Variables
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

      addResult(
        'Environment Variables',
        !!(supabaseUrl && supabaseKey),
        `URL: ${supabaseUrl ? 'Set' : 'Missing'}, Key: ${supabaseKey ? 'Set' : 'Missing'}`,
        { 
          url: supabaseUrl,
          keyLength: supabaseKey ? supabaseKey.length : 0,
          keyPrefix: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'N/A'
        }
      );

      // Test 2: Network Connectivity to Supabase
      if (supabaseUrl) {
        try {
          addResult('Testing Network...', true, 'Testing direct network connection to Supabase...');
          
          // Test basic fetch to Supabase REST API
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'HEAD',
            headers: {
              'apikey': supabaseKey,
              'Content-Type': 'application/json'
            }
          });

          addResult(
            'Network Connectivity',
            response.ok,
            `HTTP ${response.status}: ${response.statusText}`,
            {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries())
            }
          );
        } catch (networkError) {
          addResult(
            'Network Connectivity',
            false,
            `Network Error: ${networkError.message}`,
            {
              error: networkError.name,
              message: networkError.message,
              stack: networkError.stack
            }
          );
        }

        // Test 3: Supabase Client Creation
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const client = createClient(supabaseUrl, supabaseKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          });

          addResult('Client Creation', true, 'Supabase client created successfully', {
            clientKeys: Object.keys(client)
          });

          // Test 4: Simple REST API Call
          try {
            const { data, error, status, statusText } = await client
              .from('organizations')
              .select('count', { count: 'exact', head: true });

            if (error) {
              addResult(
                'REST API Test',
                false,
                `Supabase Error: ${error.message}`,
                {
                  error: error,
                  status: status,
                  statusText: statusText,
                  code: error.code,
                  details: error.details,
                  hint: error.hint
                }
              );
            } else {
              addResult('REST API Test', true, `Successfully connected to database`, { data, status });
            }
          } catch (restError) {
            addResult(
              'REST API Test',
              false,
              `REST API Error: ${restError.message}`,
              {
                name: restError.name,
                message: restError.message,
                stack: restError.stack
              }
            );
          }

          // Test 5: Authentication Service
          try {
            const { data: authData, error: authError } = await client.auth.getUser();
            
            if (authError) {
              addResult('Auth Service', true, `Auth service working: ${authError.message}`, { authError });
            } else {
              addResult('Auth Service', true, `Auth service working: ${authData.user ? 'User logged in' : 'No user'}`, { authData });
            }
          } catch (authTestError) {
            addResult('Auth Service', false, `Auth Error: ${authTestError.message}`, { authTestError });
          }

        } catch (clientError) {
          addResult('Client Creation', false, `Client Error: ${clientError.message}`, { clientError });
        }
      }

      // Test 6: Browser Environment
      addResult(
        'Browser Environment',
        true,
        'Browser capabilities check',
        {
          userAgent: navigator.userAgent,
          onLine: navigator.onLine,
          cookieEnabled: navigator.cookieEnabled,
          localStorage: typeof localStorage !== 'undefined',
          fetch: typeof fetch !== 'undefined',
          location: window.location.href,
          origin: window.location.origin
        }
      );

      // Test 7: CORS Preflight Test
      if (supabaseUrl) {
        try {
          const corsResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?select=id&limit=1`, {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Content-Type': 'application/json'
            }
          });

          const corsText = await corsResponse.text();
          
          addResult(
            'CORS Test',
            corsResponse.ok,
            `CORS Status: ${corsResponse.status}`,
            {
              status: corsResponse.status,
              statusText: corsResponse.statusText,
              responseText: corsText,
              headers: Object.fromEntries(corsResponse.headers.entries())
            }
          );
        } catch (corsError) {
          addResult(
            'CORS Test',
            false,
            `CORS Error: ${corsError.message}`,
            {
              name: corsError.name,
              message: corsError.message,
              stack: corsError.stack
            }
          );
        }
      }

    } catch (globalError) {
      addResult('Global Error', false, `Unexpected error: ${globalError.message}`, { globalError });
    } finally {
      setLoading(false);
    }
  };

  const downloadDiagnostics = () => {
    const diagnosticsData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      results: results
    };

    const blob = new Blob([JSON.stringify(diagnosticsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krishisethu-diagnostics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>🔍 Detailed Supabase Diagnostics</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3>Status: {loading ? 'Running diagnostics...' : 'Diagnostics Complete'}</h3>
        <div>
          <span style={{ color: 'green' }}>✅ Passed: {successCount}</span>
          {' | '}
          <span style={{ color: 'red' }}>❌ Failed: {failCount}</span>
        </div>
        <button 
          onClick={downloadDiagnostics}
          style={{ 
            marginTop: '10px',
            padding: '5px 10px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Download Full Report
        </button>
      </div>

      <div>
        <h3>Diagnostic Results:</h3>
        {results.map((result, index) => (
          <div 
            key={index}
            style={{ 
              margin: '10px 0', 
              padding: '15px', 
              backgroundColor: result.success ? '#e8f5e8' : '#ffe8e8',
              border: `1px solid ${result.success ? '#4CAF50' : '#f44336'}`,
              borderRadius: '8px'
            }}
          >
            <div>
              <strong>{result.success ? '✅' : '❌'} {result.test}</strong>
            </div>
            <div style={{ margin: '5px 0' }}>{result.message}</div>
            {result.details && (
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', color: '#666' }}>Technical Details</summary>
                <pre style={{ 
                  fontSize: '11px', 
                  overflow: 'auto', 
                  backgroundColor: '#f5f5f5',
                  padding: '10px',
                  margin: '5px 0',
                  borderRadius: '4px',
                  maxHeight: '300px'
                }}>
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px' }}>
        <h4>🔧 Troubleshooting Guide:</h4>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li><strong>If Network Connectivity fails:</strong> Check firewall, antivirus, or corporate proxy settings</li>
          <li><strong>If CORS Test fails:</strong> Verify Supabase project URL and ensure it's accessible</li>
          <li><strong>If Environment Variables missing:</strong> Check your .env file in the project root</li>
          <li><strong>If REST API fails:</strong> Verify Supabase API key permissions and RLS policies</li>
          <li><strong>If Auth Service fails:</strong> Check Supabase authentication settings</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
        <p>Run this diagnostic whenever you encounter connectivity issues with Supabase</p>
      </div>
    </div>
  );
};

export default DetailedDiagnostic;
