import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const MasterTest = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testingSuite, setTestingSuite] = useState('');
  const [overallStatus, setOverallStatus] = useState({ passed: 0, failed: 0 });

  const addResult = (suite, test, status, message, details = null) => {
    const result = {
      id: Date.now() + Math.random(),
      suite,
      test,
      status,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setResults(prev => [...prev, result]);
    
    // Update overall status
    setOverallStatus(prev => ({
      passed: prev.passed + (status === 'PASS' ? 1 : 0),
      failed: prev.failed + (status === 'FAIL' ? 1 : 0)
    }));
  };

  const clearResults = () => {
    setResults([]);
    setOverallStatus({ passed: 0, failed: 0 });
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Test Suite 1: Environment & Configuration
  const testEnvironment = async () => {
    setTestingSuite('Environment & Configuration');
    
    // Test 1.1: Environment Variables
    const url = process.env.REACT_APP_SUPABASE_URL;
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    if (url && key) {
      addResult('Environment', 'Environment Variables', 'PASS', 
        `URL: ${url.substring(0, 30)}..., Key: ${key.length} chars`);
    } else {
      addResult('Environment', 'Environment Variables', 'FAIL', 
        'Missing environment variables');
    }

    // Test 1.2: Correct Project ID
    const expectedProject = 'lnljcgttcdhrduixirgf';
    const hasCorrectProject = url?.includes(expectedProject);
    
    addResult('Environment', 'Correct Project ID', hasCorrectProject ? 'PASS' : 'FAIL',
      hasCorrectProject ? `Using correct project: ${expectedProject}` : 'Wrong project ID detected');

    // Test 1.3: Client Creation
    try {
      const testClient = supabase;
      addResult('Environment', 'Client Creation', 'PASS', 'Supabase client created successfully');
    } catch (error) {
      addResult('Environment', 'Client Creation', 'FAIL', `Client creation failed: ${error.message}`);
    }
  };

  // Test Suite 2: Network Connectivity
  const testNetworkConnectivity = async () => {
    setTestingSuite('Network Connectivity');
    
    // Test 2.1: Basic HTTP Connectivity
    try {
      const response = await fetch('https://lnljcgttcdhrduixirgf.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY
        }
      });
      
      addResult('Network', 'HTTP Connectivity', response.ok ? 'PASS' : 'FAIL',
        `HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      addResult('Network', 'HTTP Connectivity', 'FAIL', `Network error: ${error.message}`);
    }

    // Test 2.2: CORS Configuration
    try {
      const response = await fetch('https://lnljcgttcdhrduixirgf.supabase.co/rest/v1/organizations?select=count&limit=0', {
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      addResult('Network', 'CORS Configuration', response.ok ? 'PASS' : 'FAIL',
        `CORS test: ${response.status}`);
    } catch (error) {
      addResult('Network', 'CORS Configuration', 'FAIL', `CORS error: ${error.message}`);
    }
  };

  // Test Suite 3: Database Schema & Tables
  const testDatabaseSchema = async () => {
    setTestingSuite('Database Schema & Tables');
    
    const tables = [
      'organizations',
      'profiles', 
      'categories',
      'products',
      'customers',
      'suppliers',
      'sales_orders',
      'purchase_orders'
    ];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          addResult('Database', `Table: ${table}`, 'FAIL', error.message);
        } else {
          addResult('Database', `Table: ${table}`, 'PASS', `${count || 0} records`);
        }
        await sleep(100); // Prevent rate limiting
      } catch (error) {
        addResult('Database', `Table: ${table}`, 'FAIL', error.message);
      }
    }
  };

  // Test Suite 4: Authentication System
  const testAuthentication = async () => {
    setTestingSuite('Authentication System');
    
    // Test 4.1: Get Current Session
    try {
      const { data: session, error } = await supabase.auth.getSession();
      
      if (error) {
        addResult('Auth', 'Session Check', 'FAIL', error.message);
      } else {
        addResult('Auth', 'Session Check', 'PASS', 
          session?.session ? 'User logged in' : 'No active session (normal)');
      }
    } catch (error) {
      addResult('Auth', 'Session Check', 'FAIL', error.message);
    }

    // Test 4.2: Auth Service Availability
    try {
      const response = await fetch('https://lnljcgttcdhrduixirgf.supabase.co/auth/v1/settings', {
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY
        }
      });
      
      addResult('Auth', 'Auth Service', response.ok ? 'PASS' : 'FAIL',
        `Auth service: ${response.status}`);
    } catch (error) {
      addResult('Auth', 'Auth Service', 'FAIL', error.message);
    }
  };

  // Test Suite 5: Multi-Tenant Features
  const testMultiTenantFeatures = async () => {
    setTestingSuite('Multi-Tenant Features');
    
    // Test 5.1: Organizations Table Data
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .limit(5);

      if (error) {
        addResult('Multi-Tenant', 'Organizations Data', 'FAIL', error.message);
      } else {
        addResult('Multi-Tenant', 'Organizations Data', 'PASS', 
          `Found ${data?.length || 0} organizations`);
      }
    } catch (error) {
      addResult('Multi-Tenant', 'Organizations Data', 'FAIL', error.message);
    }

    // Test 5.2: RLS Functions
    try {
      const { data, error } = await supabase.rpc('get_user_organization');
      
      if (error && error.message.includes('not authenticated')) {
        addResult('Multi-Tenant', 'RLS Functions', 'PASS', 
          'RLS working - function requires authentication');
      } else if (error) {
        addResult('Multi-Tenant', 'RLS Functions', 'FAIL', error.message);
      } else {
        addResult('Multi-Tenant', 'RLS Functions', 'PASS', 'RLS function accessible');
      }
    } catch (error) {
      addResult('Multi-Tenant', 'RLS Functions', 'FAIL', error.message);
    }

    // Test 5.3: User Role Functions
    try {
      const { data, error } = await supabase.rpc('get_user_role');
      
      if (error && error.message.includes('not authenticated')) {
        addResult('Multi-Tenant', 'User Role Function', 'PASS', 
          'Role function working - requires authentication');
      } else if (error) {
        addResult('Multi-Tenant', 'User Role Function', 'FAIL', error.message);
      } else {
        addResult('Multi-Tenant', 'User Role Function', 'PASS', 'Role function accessible');
      }
    } catch (error) {
      addResult('Multi-Tenant', 'User Role Function', 'FAIL', error.message);
    }
  };

  // Test Suite 6: CRUD Operations (Safe Tests)
  const testCRUDOperations = async () => {
    setTestingSuite('CRUD Operations');
    
    // Test 6.1: Read Operations
    const readTables = ['categories', 'products', 'customers'];
    
    for (const table of readTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          addResult('CRUD', `Read ${table}`, 'FAIL', error.message);
        } else {
          addResult('CRUD', `Read ${table}`, 'PASS', 
            `Read operation successful (${data?.length || 0} records)`);
        }
        await sleep(100);
      } catch (error) {
        addResult('CRUD', `Read ${table}`, 'FAIL', error.message);
      }
    }
  };

  // Test Suite 7: Performance & Optimization
  const testPerformance = async () => {
    setTestingSuite('Performance & Optimization');
    
    // Test 7.1: Query Response Time
    const startTime = Date.now();
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(10);
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        addResult('Performance', 'Query Response Time', 'FAIL', error.message);
      } else {
        const status = responseTime < 1000 ? 'PASS' : 'WARN';
        addResult('Performance', 'Query Response Time', status, 
          `${responseTime}ms (${status === 'PASS' ? 'Good' : 'Slow'})`);
      }
    } catch (error) {
      addResult('Performance', 'Query Response Time', 'FAIL', error.message);
    }

    // Test 7.2: Client Memory Usage
    const memoryInfo = performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
    } : null;
    
    addResult('Performance', 'Memory Usage', 'INFO', 
      memoryInfo ? `${memoryInfo.used}MB / ${memoryInfo.total}MB` : 'Memory info not available');
  };

  // Master Test Runner
  const runMasterTest = async () => {
    if (loading) return;
    
    setLoading(true);
    clearResults();
    
    try {
      addResult('System', 'Master Test Started', 'INFO', 'Running comprehensive test suite...');
      
      await testEnvironment();
      await sleep(500);
      
      await testNetworkConnectivity();
      await sleep(500);
      
      await testDatabaseSchema();
      await sleep(500);
      
      await testAuthentication();
      await sleep(500);
      
      await testMultiTenantFeatures();
      await sleep(500);
      
      await testCRUDOperations();
      await sleep(500);
      
      await testPerformance();
      
      addResult('System', 'Master Test Completed', 'INFO', 
        `Tests completed: ${overallStatus.passed + overallStatus.failed} total`);
      
    } catch (error) {
      addResult('System', 'Master Test Error', 'FAIL', error.message);
    } finally {
      setLoading(false);
      setTestingSuite('');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS': return 'bg-green-50 border-green-500 text-green-800';
      case 'FAIL': return 'bg-red-50 border-red-500 text-red-800';
      case 'WARN': return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      case 'INFO': return 'bg-blue-50 border-blue-500 text-blue-800';
      default: return 'bg-gray-50 border-gray-500 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'WARN': return '⚠️';
      case 'INFO': return 'ℹ️';
      default: return '🔄';
    }
  };

  const downloadReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: overallStatus,
      results: results,
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krishisethu-master-test-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🚀 KrishiSethu Master Test Suite</h1>
        <p className="text-gray-600">Comprehensive system validation for Supabase integration</p>
        
        {/* Status Dashboard */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-800">{overallStatus.passed}</div>
            <div className="text-green-600">Tests Passed</div>
          </div>
          <div className="bg-red-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-800">{overallStatus.failed}</div>
            <div className="text-red-600">Tests Failed</div>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-800">
              {overallStatus.passed + overallStatus.failed}
            </div>
            <div className="text-blue-600">Total Tests</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6 justify-center">
        <button
          onClick={runMasterTest}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? '🔄 Running Tests...' : '🚀 Run Master Test'}
        </button>
        
        <button
          onClick={clearResults}
          disabled={loading}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
        >
          Clear Results
        </button>
        
        <button
          onClick={downloadReport}
          disabled={results.length === 0}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          📥 Download Report
        </button>
      </div>

      {/* Current Testing Suite */}
      {testingSuite && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="font-medium text-blue-800">Testing: {testingSuite}</span>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Test Results</h2>
        
        {results.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🔬</div>
            <p>No tests run yet. Click "Run Master Test" to start comprehensive testing.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                className={`p-4 rounded-lg border-l-4 ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getStatusIcon(result.status)}</span>
                      <span className="font-medium">{result.suite}</span>
                      <span className="text-gray-400">•</span>
                      <span>{result.test}</span>
                    </div>
                    <p className="text-sm">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-gray-600">View Details</summary>
                        <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 ml-4">{result.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>KrishiSethu Master Test Suite v1.0 | Comprehensive Supabase Integration Testing</p>
      </div>
    </div>
  );
};

export default MasterTest;
