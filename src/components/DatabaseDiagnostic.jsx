import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { productOperations } from '../lib/supabaseDb';

const DatabaseDiagnostic = ({ onClose }) => {
  const [results, setResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setLogs([]);
    setResults({});
    
    addLog('🔍 Starting database diagnostics...', 'info');
    
    const testResults = {};

    // Test 1: Basic Authentication
    try {
      addLog('1️⃣ Testing authentication state...', 'info');
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw authError;
      }
      
      testResults.auth = {
        status: 'success',
        message: `Authenticated as: ${authData?.user?.email || 'Anonymous'}`,
        details: authData
      };
      addLog('✅ Authentication check passed', 'success');
    } catch (error) {
      testResults.auth = {
        status: 'error',
        message: `Authentication failed: ${error.message}`,
        details: error
      };
      addLog('❌ Authentication check failed', 'error');
    }

    // Test 2: Basic Database Connection
    try {
      addLog('2️⃣ Testing basic database connection...', 'info');
      const { data, error } = await supabase
        .from('products')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        throw error;
      }
      
      testResults.connection = {
        status: 'success',
        message: 'Database connection successful',
        details: { count: data }
      };
      addLog('✅ Database connection successful', 'success');
    } catch (error) {
      testResults.connection = {
        status: 'error',
        message: `Database connection failed: ${error.message}`,
        details: error
      };
      addLog('❌ Database connection failed', 'error');
    }

    // Test 3: Products Table Access
    try {
      addLog('3️⃣ Testing products table access...', 'info');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      testResults.productsTable = {
        status: 'success',
        message: `Products table accessible. Sample structure: ${data.length > 0 ? Object.keys(data[0]).join(', ') : 'Empty table'}`,
        details: data
      };
      addLog(`✅ Products table accessible (${data.length} sample records)`, 'success');
    } catch (error) {
      testResults.productsTable = {
        status: 'error',
        message: `Products table access failed: ${error.message}`,
        details: error
      };
      addLog('❌ Products table access failed', 'error');
    }

    // Test 4: Brands Table Access
    try {
      addLog('4️⃣ Testing brands table access...', 'info');
      const { data, error } = await supabase
        .from('brands')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        throw error;
      }
      
      testResults.brandsTable = {
        status: 'success',
        message: 'Brands table accessible',
        details: data
      };
      addLog('✅ Brands table accessible', 'success');
    } catch (error) {
      testResults.brandsTable = {
        status: 'error',
        message: `Brands table access failed: ${error.message}`,
        details: error
      };
      addLog('❌ Brands table access failed', 'error');
    }

    // Test 5: Categories Table Access
    try {
      addLog('5️⃣ Testing categories table access...', 'info');
      const { data, error } = await supabase
        .from('categories')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        throw error;
      }
      
      testResults.categoriesTable = {
        status: 'success',
        message: 'Categories table accessible',
        details: data
      };
      addLog('✅ Categories table accessible', 'success');
    } catch (error) {
      testResults.categoriesTable = {
        status: 'error',
        message: `Categories table access failed: ${error.message}`,
        details: error
      };
      addLog('❌ Categories table access failed', 'error');
    }

    // Test 6: Enhanced Products Query (the one that was failing)
    try {
      addLog('6️⃣ Testing enhanced products query with joins...', 'info');
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brands(id, name),
          categories(id, name)
        `)
        .limit(5);
      
      if (error) {
        throw error;
      }
      
      testResults.enhancedQuery = {
        status: 'success',
        message: `Enhanced query successful. Retrieved ${data.length} products with joins`,
        details: data
      };
      addLog(`✅ Enhanced query successful (${data.length} products)`, 'success');
    } catch (error) {
      testResults.enhancedQuery = {
        status: 'error',
        message: `Enhanced query failed: ${error.message}`,
        details: error
      };
      addLog('❌ Enhanced query failed', 'error');
    }

    // Test 7: ProductOperations.getAllProducts function
    try {
      addLog('7️⃣ Testing productOperations.getAllProducts()...', 'info');
      const products = await productOperations.getAllProducts();
      
      testResults.productOperations = {
        status: 'success',
        message: `ProductOperations successful. Retrieved ${products.length} products`,
        details: { count: products.length, sample: products[0] }
      };
      addLog(`✅ ProductOperations successful (${products.length} products)`, 'success');
    } catch (error) {
      testResults.productOperations = {
        status: 'error',
        message: `ProductOperations failed: ${error.message}`,
        details: error
      };
      addLog('❌ ProductOperations failed', 'error');
    }

    setResults(testResults);
    setIsRunning(false);
    addLog('🏁 Diagnostics completed', 'info');
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <Badge className={colors[status] || colors.warning}>
        {status === 'success' ? 'PASS' : status === 'error' ? 'FAIL' : 'UNKNOWN'}
      </Badge>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Database Diagnostics</h2>
            <div className="flex gap-2">
              <Button
                onClick={runDiagnostics}
                disabled={isRunning}
                variant="outline"
                size="sm"
              >
                {isRunning ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {isRunning ? 'Running...' : 'Rerun Tests'}
              </Button>
              <Button onClick={onClose} variant="outline" size="sm">
                Close
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Results */}
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(results).map(([test, result]) => (
                  <div key={test} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">
                          {test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h4>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-sm text-gray-600">{result.message}</p>
                      {result.details && result.status === 'error' && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">
                            Error Details
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                
                {Object.keys(results).length === 0 && isRunning && (
                  <div className="text-center py-8">
                    <Loader className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Running diagnostics...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Logs */}
            <Card>
              <CardHeader>
                <CardTitle>Live Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                      <span className={
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-green-400' :
                        'text-white'
                      }>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-gray-500">Waiting for diagnostics to start...</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          {Object.keys(results).length > 0 && !isRunning && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {Object.values(results).filter(r => r.status === 'success').length}
                    </div>
                    <div className="text-sm text-gray-500">Tests Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {Object.values(results).filter(r => r.status === 'error').length}
                    </div>
                    <div className="text-sm text-gray-500">Tests Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">
                      {Object.keys(results).length}
                    </div>
                    <div className="text-sm text-gray-500">Total Tests</div>
                  </div>
                </div>
                
                {Object.values(results).some(r => r.status === 'error') && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">Issues Found:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {Object.entries(results)
                        .filter(([_, result]) => result.status === 'error')
                        .map(([test, result]) => (
                          <li key={test}>• {test}: {result.message}</li>
                        ))}
                    </ul>
                  </div>
                )}
                
                {Object.values(results).every(r => r.status === 'success') && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">All Tests Passed! ✅</h4>
                    <p className="text-sm text-green-700">
                      Your database connection and inventory system are working correctly.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseDiagnostic;
