/**
 * 🧪 DATABASE TEST PANEL
 * 
 * UI component for running database integration tests
 */

import React, { useState } from 'react'
import { 
  runAllTests, 
  quickConnectivityTest,
  testDatabaseHealth,
  testCamelCaseViews,
  testServiceLayer,
  testNotifications 
} from '../utils/testDatabaseIntegration'

const DatabaseTestPanel = () => {
  const [testResults, setTestResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState('')

  const runTest = async (testFunction, testName) => {
    setIsRunning(true)
    setCurrentTest(testName)
    
    try {
      const result = await testFunction()
      setTestResults(prev => ({
        ...prev,
        [testName]: result
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message }
      }))
    }
    
    setIsRunning(false)
    setCurrentTest('')
  }

  const runAllTestsSuite = async () => {
    setIsRunning(true)
    setCurrentTest('Running all tests...')
    setTestResults(null)
    
    try {
      const results = await runAllTests()
      setTestResults(results)
    } catch (error) {
      setTestResults({
        error: error.message,
        success: false
      })
    }
    
    setIsRunning(false)
    setCurrentTest('')
  }

  const clearResults = () => {
    setTestResults(null)
  }

  const getStatusIcon = (success) => {
    if (success === undefined) return '⏳'
    return success ? '✅' : '❌'
  }

  const getStatusColor = (success) => {
    if (success === undefined) return 'text-yellow-600'
    return success ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="database-test-panel p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          🧪 Database Integration Tests
        </h2>
        <div className="flex gap-2">
          <button
            onClick={runAllTestsSuite}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running...' : 'Run All Tests'}
          </button>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Current Test Status */}
      {isRunning && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center">
            <span className="animate-spin mr-2">⏳</span>
            <span className="text-yellow-800">{currentTest}</span>
          </div>
        </div>
      )}

      {/* Individual Test Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => runTest(quickConnectivityTest, 'connectivity')}
          disabled={isRunning}
          className="p-3 text-left border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <div className="font-medium">⚡ Connectivity</div>
          <div className="text-sm text-gray-600">Quick connection test</div>
        </button>

        <button
          onClick={() => runTest(testDatabaseHealth, 'health')}
          disabled={isRunning}
          className="p-3 text-left border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <div className="font-medium">🏥 Health Check</div>
          <div className="text-sm text-gray-600">Comprehensive diagnostics</div>
        </button>

        <button
          onClick={() => runTest(testCamelCaseViews, 'camelCase')}
          disabled={isRunning}
          className="p-3 text-left border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <div className="font-medium">🐪 CamelCase Views</div>
          <div className="text-sm text-gray-600">Field mapping test</div>
        </button>

        <button
          onClick={() => runTest(testServiceLayer, 'services')}
          disabled={isRunning}
          className="p-3 text-left border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <div className="font-medium">🔧 Service Layer</div>
          <div className="text-sm text-gray-600">CRUD operations</div>
        </button>

        <button
          onClick={() => runTest(testNotifications, 'notifications')}
          disabled={isRunning}
          className="p-3 text-left border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <div className="font-medium">📬 Notifications</div>
          <div className="text-sm text-gray-600">Notification system</div>
        </button>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="test-results">
          <h3 className="text-lg font-medium mb-4">Test Results</h3>
          
          {/* Summary */}
          {testResults.summary && (
            <div className={`mb-4 p-4 rounded ${
              testResults.summary.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`font-medium ${
                testResults.summary.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResults.summary.success ? '🎉 All Tests Passed!' : '⚠️ Some Tests Failed'}
              </div>
              <div className="text-sm mt-1">
                {testResults.summary.passed}/{testResults.summary.total} tests passed
              </div>
            </div>
          )}

          {/* Individual Test Results */}
          <div className="space-y-3">
            {testResults.tests ? (
              Object.entries(testResults.tests).map(([testName, result]) => (
                <div key={testName} className="border border-gray-200 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium capitalize">{testName}</div>
                    <span className={getStatusColor(result.success)}>
                      {getStatusIcon(result.success)}
                    </span>
                  </div>
                  
                  {result.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                      Error: {result.error}
                    </div>
                  )}
                  
                  {result.note && (
                    <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded mb-2">
                      Note: {result.note}
                    </div>
                  )}
                  
                  {/* Detailed Results */}
                  {result.success && Object.keys(result).length > 1 && (
                    <div className="text-sm text-gray-600">
                      <details>
                        <summary className="cursor-pointer hover:text-gray-800">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Single test result
              <div className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Test Result</div>
                  <span className={getStatusColor(testResults.success)}>
                    {getStatusIcon(testResults.success)}
                  </span>
                </div>
                
                {testResults.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Error: {testResults.error}
                  </div>
                )}
                
                {testResults.message && (
                  <div className="text-sm text-green-600">
                    {testResults.message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timestamp */}
          {testResults.timestamp && (
            <div className="mt-4 text-xs text-gray-500">
              Test completed at: {new Date(testResults.timestamp).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Run "Connectivity" first to ensure basic database access</li>
          <li>• "Health Check" provides comprehensive diagnostics</li>
          <li>• "CamelCase Views" tests the field mapping solution</li>
          <li>• "Service Layer" tests CRUD operations</li>
          <li>• "Notifications" requires a logged-in user for full testing</li>
          <li>• "Run All Tests" executes the complete test suite</li>
        </ul>
      </div>
    </div>
  )
}

export default DatabaseTestPanel