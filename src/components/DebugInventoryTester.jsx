/**
 * Debug Inventory Tester Component
 * 
 * This component provides a simple interface to test all the debug-enhanced
 * inventory loading functions. Use this to diagnose exactly where inventory
 * loading gets stuck.
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugInventoryTester = ({ onClose }) => {
  const { 
    testInventoryLoading, 
    testSupabaseConnection, 
    getInventoryDebugStats, 
    clearInventoryCache,
    userProfile 
  } = useAuth();

  const [isTestingInventory, setIsTestingInventory] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResults, setTestResults] = useState({});

  const handleTestInventory = async () => {
    setIsTestingInventory(true);
    console.clear(); // Clear console for cleaner debug output
    
    try {
      console.log('🧪 [TESTER] Starting inventory loading test...');
      const result = await testInventoryLoading();
      
      setTestResults(prev => ({
        ...prev,
        inventory: {
          success: true,
          data: result,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      
      console.log('✅ [TESTER] Inventory test completed successfully!');
      alert(`✅ Inventory Test Success!\n\nProducts: ${result.products?.length || 0}\nCategories: ${result.categories?.length || 0}\nLoading Method: ${result.debug?.loadingMethod || 'unknown'}`);
      
    } catch (error) {
      console.error('❌ [TESTER] Inventory test failed:', error);
      
      setTestResults(prev => ({
        ...prev,
        inventory: {
          success: false,
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      
      alert(`❌ Inventory Test Failed!\n\nError: ${error.message}\n\nCheck the browser console for detailed debug information.`);
    } finally {
      setIsTestingInventory(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    
    try {
      console.log('🧪 [TESTER] Starting connection test...');
      const result = await testSupabaseConnection();
      
      setTestResults(prev => ({
        ...prev,
        connection: {
          success: result.success,
          responseTime: result.responseTime,
          error: result.error,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      
      if (result.success) {
        alert(`✅ Connection Test Success!\n\nResponse Time: ${result.responseTime}ms\nNetwork: ${navigator.onLine ? 'Online' : 'Offline'}`);
      } else {
        alert(`❌ Connection Test Failed!\n\nError: ${result.error}\nNetwork: ${navigator.onLine ? 'Online' : 'Offline'}`);
      }
      
    } catch (error) {
      console.error('❌ [TESTER] Connection test failed:', error);
      alert(`❌ Connection Test Failed!\n\nError: ${error.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleShowStats = () => {
    const stats = getInventoryDebugStats();
    
    const statsText = `📊 Inventory Debug Statistics:

🗄️ Cache Status: ${stats.isCached ? 'Valid' : 'Empty/Expired'}
📅 Cache Age: ${stats.cacheAge ? `${Math.round(stats.cacheAge / 1000)}s` : 'N/A'}
⏳ Currently Loading: ${stats.isLoading ? 'Yes' : 'No'}
🔄 Load Attempts: ${stats.loadAttempts}/${stats.maxRetries}
🌐 Network Status: ${stats.networkStatus}
🔧 Debug Mode: ${stats.debugMode ? 'Enabled' : 'Disabled'}
🔗 Supabase URL: ${stats.supabaseUrl}

🛠️ Cache Size: ${stats.cacheSize} items`;

    alert(statsText);
  };

  const handleClearCache = () => {
    clearInventoryCache();
    alert('🧹 Inventory cache cleared!\n\nNext inventory load will fetch fresh data from the database.');
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🔬 Debug Inventory Tester</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>

        {/* User Profile Info */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">👤 Current User Profile</h3>
          <div className="text-sm text-blue-700">
            <div><strong>ID:</strong> {userProfile?.id || 'N/A'}</div>
            <div><strong>Email:</strong> {userProfile?.email || 'N/A'}</div>
            <div><strong>Role:</strong> {userProfile?.role || userProfile?.account_type || 'N/A'}</div>
            <div><strong>Active:</strong> {userProfile?.is_active ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Test Inventory Loading */}
          <button
            onClick={handleTestInventory}
            disabled={isTestingInventory}
            className={`p-4 rounded-lg border-2 transition-all ${
              isTestingInventory 
                ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                : 'bg-green-50 border-green-300 hover:bg-green-100 hover:border-green-400'
            }`}
          >
            <div className="text-left">
              <div className="text-lg font-semibold text-green-800 mb-2">
                {isTestingInventory ? '⏳ Testing...' : '🧪 Test Inventory Loading'}
              </div>
              <div className="text-sm text-green-600">
                Runs the debug-enhanced fetchInventory function with detailed logging
              </div>
            </div>
          </button>

          {/* Test Connection */}
          <button
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            className={`p-4 rounded-lg border-2 transition-all ${
              isTestingConnection
                ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                : 'bg-blue-50 border-blue-300 hover:bg-blue-100 hover:border-blue-400'
            }`}
          >
            <div className="text-left">
              <div className="text-lg font-semibold text-blue-800 mb-2">
                {isTestingConnection ? '⏳ Testing...' : '📡 Test Supabase Connection'}
              </div>
              <div className="text-sm text-blue-600">
                Tests basic connectivity to Supabase database
              </div>
            </div>
          </button>

          {/* Show Debug Stats */}
          <button
            onClick={handleShowStats}
            className="p-4 rounded-lg border-2 border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition-all"
          >
            <div className="text-left">
              <div className="text-lg font-semibold text-purple-800 mb-2">📊 Show Debug Stats</div>
              <div className="text-sm text-purple-600">
                Display current cache status and debug information
              </div>
            </div>
          </button>

          {/* Clear Cache */}
          <button
            onClick={handleClearCache}
            className="p-4 rounded-lg border-2 border-orange-300 bg-orange-50 hover:bg-orange-100 hover:border-orange-400 transition-all"
          >
            <div className="text-left">
              <div className="text-lg font-semibold text-orange-800 mb-2">🧹 Clear Cache</div>
              <div className="text-sm text-orange-600">
                Clear cached inventory data to force fresh loading
              </div>
            </div>
          </button>
        </div>

        {/* Test Results */}
        {(testResults.inventory || testResults.connection) && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">📋 Latest Test Results</h3>
            
            {testResults.inventory && (
              <div className="mb-3 p-3 rounded border-l-4 border-l-green-400 bg-white">
                <div className="flex justify-between items-center">
                  <span className="font-medium">🧪 Inventory Test</span>
                  <span className="text-sm text-gray-500">{testResults.inventory.timestamp}</span>
                </div>
                <div className={`text-sm mt-1 ${testResults.inventory.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.inventory.success ? (
                    `✅ Success - ${testResults.inventory.data?.products?.length || 0} products, ${testResults.inventory.data?.categories?.length || 0} categories`
                  ) : (
                    `❌ Failed - ${testResults.inventory.error}`
                  )}
                </div>
              </div>
            )}

            {testResults.connection && (
              <div className="p-3 rounded border-l-4 border-l-blue-400 bg-white">
                <div className="flex justify-between items-center">
                  <span className="font-medium">📡 Connection Test</span>
                  <span className="text-sm text-gray-500">{testResults.connection.timestamp}</span>
                </div>
                <div className={`text-sm mt-1 ${testResults.connection.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.connection.success ? (
                    `✅ Success - ${testResults.connection.responseTime}ms response time`
                  ) : (
                    `❌ Failed - ${testResults.connection.error}`
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 p-4 rounded-lg mt-4">
          <h3 className="font-semibold text-yellow-800 mb-2">💡 How to Use</h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <div>1. <strong>Open browser console</strong> (F12) to see detailed debug logs</div>
            <div>2. <strong>Test Inventory Loading</strong> to see exactly where the process stops</div>
            <div>3. <strong>Check Debug Stats</strong> to see cache status and load attempts</div>
            <div>4. <strong>Clear Cache</strong> if you want to force a fresh load</div>
            <div>5. Look for colored console logs with timestamps for step-by-step tracing</div>
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <div className="flex justify-center mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close Tester
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugInventoryTester;
